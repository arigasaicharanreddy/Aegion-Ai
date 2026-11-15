import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appendAuditLog, getActiveSuperAdminEmail, loadDb, persistDb } from '../data/database';
import {
  createUserSession,
  getSessionCookieOptions,
  requireSession,
  resolveSessionUser,
  revokeUserSessions,
  sanitizeUserForClient,
  SESSION_COOKIE_NAME,
  type AuthenticatedRequest,
} from '../middleware/auth';
import {
  createRateLimiter,
  generateSecureToken,
  hashPassword,
  sha256Hex,
  validateStrongPassword,
  verifyPassword,
} from '../security/crypto';
import { dispatchEmailNotification, isEmailDeliveryConfigured } from '../services/notificationService';
import {
  getPlatformThemeById,
  isValidPlatformThemeId,
  resolveLegacyPlatformThemeId,
} from '../../src/platform-themes/catalog';
import type { PlatformAnimationMode } from '../../src/types/auth';

export const authRouter = Router();

const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'auth',
});

export const PENDING_ACCESS_MESSAGE =
  'Your Aegion AI workspace access request is currently under review. You will receive an email notification once your request has been approved.';
export const REJECTED_ACCESS_MESSAGE =
  'Your workspace access request was not approved. Please contact Aegion AI support if you require further information.';

let cachedFirebaseApiKey: string | null = null;
async function getFirebaseApiKey(): Promise<string> {
  if (cachedFirebaseApiKey) return cachedFirebaseApiKey;
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    cachedFirebaseApiKey = parsed.apiKey || '';
  } catch {
    cachedFirebaseApiKey = '';
  }
  return cachedFirebaseApiKey;
}

function validateSafeAvatar(input: unknown): { valid: boolean; value?: string; error?: string } {
  if (input === undefined || input === null || input === '') {
    return { valid: true, value: undefined };
  }
  if (typeof input !== 'string') {
    return { valid: false, error: 'Profile picture must be a valid URL or uploaded image.' };
  }
  const trimmed = input.trim();
  if (!trimmed) return { valid: true, value: undefined };
  if (/^https?:\/\/[^\s]{4,500}$/i.test(trimmed)) {
    return { valid: true, value: trimmed };
  }
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    if (trimmed.length > 1_500_000) {
      return { valid: false, error: 'Profile image must be under 1 MB.' };
    }
    return { valid: true, value: trimmed };
  }
  return { valid: false, error: 'Profile picture must be an HTTPS image URL or a PNG/JPG/WEBP upload.' };
}

authRouter.get('/me', async (req, res) => {
  const { user } = await resolveSessionUser(req);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({
    authenticated: true,
    user: sanitizeUserForClient(user),
  });
});

authRouter.post('/logout', async (req, res) => {
  const { user, tokenHash } = await resolveSessionUser(req);
  if (user && tokenHash) {
    const db = await loadDb();
    db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
    appendAuditLog(db, user.email, user.role, 'LOGOUT', user.email, 'Allowed');
    await persistDb(db);
  }
  res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
  return res.json({ ok: true });
});

authRouter.post('/admin/login', authRateLimiter, async (req, res) => {
  const { email, password, mfaCode } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const db = await loadDb();
  const activeAdminEmail = getActiveSuperAdminEmail(db);
  const admin = db.users.find((u) => u.role === 'super_admin');

  if (!admin || normalizedEmail !== activeAdminEmail.toLowerCase()) {
    appendAuditLog(db, normalizedEmail || 'unknown', 'guest', 'SUPER_ADMIN_LOGIN_ATTEMPT', 'Admin Portal', 'Denied');
    await persistDb(db);
    return res.status(403).json({
      error: 'Only the authorized Super Admin account may sign in through this portal.',
    });
  }

  if (!admin.passwordHash || !verifyPassword(String(password || ''), admin.passwordHash)) {
    appendAuditLog(db, admin.email, 'super_admin', 'SUPER_ADMIN_LOGIN', 'Invalid Credentials', 'Denied');
    await persistDb(db);
    return res.status(401).json({
      error: admin.customPasswordSet
        ? 'Invalid password. If you rotated your password and no longer remember it, use Super Admin password recovery.'
        : 'Invalid Super Admin credentials.',
      passwordRotated: Boolean(admin.customPasswordSet),
    });
  }

  if (admin.mfaEnabled) {
    const expectedCode = admin.mfaCodeHint || '482910';
    if (String(mfaCode || '').trim() !== expectedCode) {
      return res.status(401).json({
        error: 'Valid MFA verification code is required.',
        mfaRequired: true,
      });
    }
  }

  admin.lastLoginAt = new Date().toISOString();
  appendAuditLog(db, admin.email, admin.role, 'SUPER_ADMIN_LOGIN', admin.email, 'Allowed');
  await persistDb(db);

  const sessionToken = await createUserSession(admin, res);
  return res.json({
    sessionToken,
    mustChangePassword: Boolean(admin.mustChangePassword),
    user: sanitizeUserForClient(admin),
  });
});

authRouter.post('/admin/forgot-password', authRateLimiter, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const db = await loadDb();
  const admin = db.users.find((u) => u.role === 'super_admin');
  const activeEmail = admin?.email || getActiveSuperAdminEmail(db);

  if (!admin || email !== activeEmail.toLowerCase()) {
    return res.json({
      ok: true,
      emailConfigured: isEmailDeliveryConfigured(db),
      message: 'If the submitted email matches the Super Admin identity, recovery instructions have been processed.',
    });
  }

  const rawToken = generateSecureToken(24);
  db.oneTimeTokens.push({
    tokenHash: sha256Hex(rawToken),
    userId: admin.id,
    email: admin.email,
    purpose: 'admin_reset',
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  });
  appendAuditLog(db, admin.email, 'super_admin', 'SUPER_ADMIN_RECOVERY_REQUESTED', admin.email, 'Allowed');
  await persistDb(db);

  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const deliveryStatus = await dispatchEmailNotification({
    registrationId: admin.id,
    recipient: admin.email,
    template: 'Admin Password Recovery',
    subject: 'Aegion AI — Super Admin Password Recovery',
    htmlBody: `<p>Hello ${admin.name},</p><p>Use this single-use recovery link within 15 minutes to set a new Super Admin password:</p><p><a href="${appUrl}/?adminReset=${rawToken}">${appUrl}/?adminReset=${rawToken}</a></p>`,
  });

  return res.json({
    ok: true,
    emailConfigured: deliveryStatus === 'Sent',
    deliveryStatus,
    message:
      deliveryStatus === 'Sent'
        ? 'Recovery link sent to the Super Admin email address.'
        : 'Email delivery is not configured on the server yet. To re-provision initial access from server environment, set AEGION_SUPER_ADMIN_FORCE_RESET=true in server secrets and restart.',
  });
});

authRouter.post('/admin/reset-password', authRateLimiter, async (req, res) => {
  const { token, password } = req.body || {};
  const strength = validateStrongPassword(String(password || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' '), details: strength.errors });
  }
  const tokenHash = sha256Hex(String(token || ''));
  const db = await loadDb();
  const rec = db.oneTimeTokens.find(
    (t) => t.tokenHash === tokenHash && t.purpose === 'admin_reset' && !t.usedAt
  );
  if (!rec || new Date(rec.expiresAt).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired Super Admin recovery token.' });
  }
  const admin = db.users.find((u) => u.id === rec.userId && u.role === 'super_admin');
  if (!admin) {
    return res.status(404).json({ error: 'Super Admin record not found.' });
  }

  rec.usedAt = new Date().toISOString();
  admin.passwordHash = hashPassword(String(password));
  admin.mustChangePassword = false;
  admin.customPasswordSet = true;
  admin.updatedAt = rec.usedAt;
  appendAuditLog(db, admin.email, 'super_admin', 'SUPER_ADMIN_RECOVERY_COMPLETED', admin.email, 'Allowed');
  await persistDb(db);
  await revokeUserSessions(admin.id);

  return res.json({ ok: true });
});

authRouter.post('/admin/change-password', requireSession, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  if (user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const { currentPassword, newPassword } = req.body || {};
  const db = await loadDb();
  const admin = db.users.find((u) => u.id === user.id);
  if (!admin || !admin.passwordHash) {
    return res.status(404).json({ error: 'Super Admin record not found.' });
  }

  if (!verifyPassword(String(currentPassword || ''), admin.passwordHash)) {
    appendAuditLog(db, admin.email, admin.role, 'SUPER_ADMIN_PASSWORD_CHANGE', 'Invalid current password', 'Denied');
    await persistDb(db);
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  if (String(currentPassword) === String(newPassword)) {
    return res.status(400).json({ error: 'New password must be different from the current password.' });
  }

  const strength = validateStrongPassword(String(newPassword || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' '), details: strength.errors });
  }

  admin.passwordHash = hashPassword(String(newPassword));
  admin.mustChangePassword = false;
  admin.customPasswordSet = true;
  admin.updatedAt = new Date().toISOString();
  appendAuditLog(db, admin.email, admin.role, 'SUPER_ADMIN_PASSWORD_ROTATED', admin.email, 'Allowed');
  await persistDb(db);

  await revokeUserSessions(admin.id);
  const freshToken = await createUserSession(admin, res);

  return res.json({
    ok: true,
    sessionToken: freshToken,
    user: sanitizeUserForClient(admin),
  });
});

// Authenticated Profile Update (strictly scoped to session user)
authRouter.put('/profile', requireSession, async (req: AuthenticatedRequest, res) => {
  const sessionUser = req.authUser!;
  if (sessionUser.status !== 'active') {
    return res.status(403).json({ error: 'Account must be active to update profile.' });
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const workspaceName = typeof body.workspaceName === 'string' ? body.workspaceName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : undefined;
  const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim() : undefined;
  const country = typeof body.country === 'string' ? body.country.trim() : undefined;

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Full Name must be at least 2 characters.' });
  }

  const avatarCheck = validateSafeAvatar(body.avatarUrl);
  if (!avatarCheck.valid) {
    return res.status(400).json({ error: avatarCheck.error });
  }

  const db = await loadDb();
  const user = db.users.find((u) => u.id === sessionUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  user.name = name;
  if (workspaceName) user.workspaceName = workspaceName;
  if (phone !== undefined) user.phone = phone;
  if (body.avatarUrl !== undefined) user.avatarUrl = avatarCheck.value;

  if (user.role !== 'super_admin') {
    if (companyName !== undefined) user.companyName = companyName;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (country !== undefined) user.country = country;
    if (body.preferences && typeof body.preferences === 'object') {
      user.preferences = {
        ...user.preferences,
        themePreference:
          body.preferences.themePreference === 'light' || body.preferences.themePreference === 'dark'
            ? body.preferences.themePreference
            : user.preferences?.themePreference,
        compactMode:
          typeof body.preferences.compactMode === 'boolean'
            ? body.preferences.compactMode
            : user.preferences?.compactMode,
        emailNotificationsEnabled:
          typeof body.preferences.emailNotificationsEnabled === 'boolean'
            ? body.preferences.emailNotificationsEnabled
            : user.preferences?.emailNotificationsEnabled,
      };
    }
  }

  user.updatedAt = new Date().toISOString();
  appendAuditLog(db, user.email, user.role, 'UPDATE_PROFILE', user.email, 'Allowed');
  await persistDb(db);

  return res.json({
    ok: true,
    user: sanitizeUserForClient(user),
  });
});

// Authenticated Platform Theme & Motion Preference (independent per user & Super Admin)
authRouter.put('/theme-preference', requireSession, async (req: AuthenticatedRequest, res) => {
  const sessionUser = req.authUser!;
  if (sessionUser.status !== 'active') {
    return res.status(403).json({ error: 'Account must be active to customize platform theme.' });
  }

  const body = req.body || {};
  const requestedThemeId = typeof body.themeId === 'string' ? body.themeId.trim() : '';
  const requestedAnimMode = body.animationMode as PlatformAnimationMode | undefined;
  const requested3D = typeof body.enable3D === 'boolean' ? body.enable3D : undefined;

  const validAnimModes = new Set<PlatformAnimationMode>(['full', 'balanced', 'minimal', 'disabled']);
  if (requestedAnimMode && !validAnimModes.has(requestedAnimMode)) {
    return res.status(400).json({ error: 'Invalid animation mode.' });
  }

  const db = await loadDb();
  const user = db.users.find((u) => u.id === sessionUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const config = db.platformThemeConfig;
  const fallbackTheme =
    user.role === 'super_admin' ? config.defaultAdminThemeId : config.defaultUserThemeId;
  const candidateThemeId = requestedThemeId || user.platformTheme?.themeId || fallbackTheme;
  if (requestedThemeId && !isValidPlatformThemeId(requestedThemeId)) {
    return res.status(400).json({ error: 'Requested platform theme does not exist in the catalog.' });
  }
  let resolvedThemeId = resolveLegacyPlatformThemeId(candidateThemeId);

  const themeDef = getPlatformThemeById(resolvedThemeId);
  const isDisabledForUser =
    user.role !== 'super_admin' &&
    (config.disabledThemeIds.includes(resolvedThemeId) ||
      config.disabledCategories.includes(themeDef.category));

  let appliedFallback = false;
  let warning: string | undefined;

  if (isDisabledForUser) {
    resolvedThemeId = resolveLegacyPlatformThemeId(config.fallbackThemeId);
    appliedFallback = true;
    warning = `Selected theme "${themeDef.name}" is disabled by your administrator. Applied fallback theme instead.`;
  }

  const now = new Date().toISOString();
  const prev = user.platformTheme;
  user.platformTheme = {
    themeId: resolvedThemeId,
    animationMode: requestedAnimMode || prev?.animationMode || 'balanced',
    enable3D: requested3D !== undefined ? false : prev?.enable3D ?? false,
    updatedAt: now,
  };
  user.updatedAt = now;

  appendAuditLog(
    db,
    user.email,
    user.role,
    'UPDATE_PLATFORM_THEME',
    `${resolvedThemeId} (${user.platformTheme.animationMode})`,
    'Allowed'
  );
  await persistDb(db);

  return res.json({
    ok: true,
    appliedFallback,
    warning,
    user: sanitizeUserForClient(user),
  });
});

// Request Verified Email Address Change (Super Admin & Regular Users)
authRouter.post('/request-email-change', requireSession, async (req: AuthenticatedRequest, res) => {
  const sessionUser = req.authUser!;
  if (sessionUser.status !== 'active') {
    return res.status(403).json({ error: 'Account must be active.' });
  }

  const { newEmail, currentPassword } = req.body || {};
  const normalizedNewEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';
  const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;

  if (!normalizedNewEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNewEmail)) {
    return res.status(400).json({ error: 'Please provide a valid new email address.' });
  }
  if (normalizedNewEmail === sessionUser.email.toLowerCase()) {
    return res.status(400).json({ error: 'New email address must differ from your current email.' });
  }

  const db = await loadDb();
  const user = db.users.find((u) => u.id === sessionUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.passwordHash) {
    if (!verifyPassword(String(currentPassword || ''), user.passwordHash)) {
      appendAuditLog(db, user.email, user.role, 'EMAIL_CHANGE_DENIED', normalizedNewEmail, 'Denied');
      await persistDb(db);
      return res.status(401).json({ error: 'Current password is required to change your email address.' });
    }
  }

  const conflict = db.users.find(
    (u) => u.id !== user.id && u.email.toLowerCase() === normalizedNewEmail
  );
  if (conflict) {
    return res.status(409).json({ error: 'That email address is already registered to another account.' });
  }

  if (!isEmailDeliveryConfigured(db, googleAccessToken)) {
    return res.status(400).json({
      error:
        'Cannot verify new email address because no transactional email provider is configured yet (configure Gmail API OAuth, Resend, SendGrid, or SMTP first).',
    });
  }

  const rawToken = generateSecureToken(24);
  db.oneTimeTokens.push({
    tokenHash: sha256Hex(rawToken),
    userId: user.id,
    email: user.email,
    newEmail: normalizedNewEmail,
    purpose: 'email_change',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });
  user.pendingEmail = normalizedNewEmail;
  user.updatedAt = new Date().toISOString();
  appendAuditLog(db, user.email, user.role, 'REQUEST_EMAIL_CHANGE', normalizedNewEmail, 'Allowed');
  await persistDb(db);

  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const verifyLink = `${appUrl}/?verifyEmail=${rawToken}`;
  const status = await dispatchEmailNotification({
    registrationId: user.id,
    recipient: normalizedNewEmail,
    template: 'Email Verification',
    subject: 'Aegion AI — Verify Your New Email Address',
    htmlBody: `<p>Hello ${user.name},</p><p>Click the single-use verification link below within 24 hours to confirm changing your Aegion AI login email to <strong>${normalizedNewEmail}</strong>:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
    googleAccessToken,
  });

  if (status !== 'Sent') {
    return res.status(502).json({
      error: 'Verification email dispatch failed. Your existing login email remains unchanged.',
    });
  }

  return res.json({
    ok: true,
    pendingEmail: normalizedNewEmail,
    message: `Verification email sent to ${normalizedNewEmail}. Confirm the link before it becomes your login identity.`,
  });
});

authRouter.post('/verify-email-change', authRateLimiter, async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Email verification token is required.' });
  }

  const tokenHash = sha256Hex(token.trim());
  const db = await loadDb();
  const record = db.oneTimeTokens.find(
    (t) => t.tokenHash === tokenHash && t.purpose === 'email_change'
  );

  if (!record || record.usedAt || new Date(record.expiresAt).getTime() <= Date.now() || !record.newEmail) {
    return res.status(400).json({ error: 'Invalid or expired email verification link.' });
  }

  const user = db.users.find((u) => u.id === record.userId);
  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const oldEmail = user.email;
  const now = new Date().toISOString();
  record.usedAt = now;
  user.email = record.newEmail;
  user.pendingEmail = undefined;
  user.updatedAt = now;

  if (user.role === 'super_admin' && db.notificationConfig.senderEmail.toLowerCase() === oldEmail.toLowerCase()) {
    db.notificationConfig.senderEmail = user.email;
  }

  for (const s of db.sessions) {
    if (s.userId === user.id) {
      s.email = user.email;
    }
  }

  appendAuditLog(db, user.email, user.role, 'EMAIL_CHANGE_VERIFIED', `${oldEmail} -> ${user.email}`, 'Allowed');
  await persistDb(db);

  const sessionToken = await createUserSession(user, res);
  return res.json({
    ok: true,
    sessionToken,
    user: sanitizeUserForClient(user),
  });
});

// Authenticated Password Change (works for both Super Admin and active Users after login)
authRouter.post('/change-password', requireSession, async (req: AuthenticatedRequest, res) => {
  const sessionUser = req.authUser!;
  if (sessionUser.status !== 'active') {
    return res.status(403).json({ error: 'Account must be active to change password.' });
  }

  const { currentPassword, newPassword } = req.body || {};
  const db = await loadDb();
  const user = db.users.find((u) => u.id === sessionUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.passwordHash) {
    if (!verifyPassword(String(currentPassword || ''), user.passwordHash)) {
      appendAuditLog(db, user.email, user.role, 'CHANGE_PASSWORD', 'Invalid current password', 'Denied');
      await persistDb(db);
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (String(currentPassword) === String(newPassword)) {
      return res.status(400).json({ error: 'New password must differ from current password.' });
    }
  }

  const strength = validateStrongPassword(String(newPassword || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' '), details: strength.errors });
  }

  user.passwordHash = hashPassword(String(newPassword));
  user.mustChangePassword = false;
  user.customPasswordSet = true;
  user.updatedAt = new Date().toISOString();
  appendAuditLog(db, user.email, user.role, 'CHANGE_PASSWORD', user.email, 'Allowed');
  await persistDb(db);

  await revokeUserSessions(user.id);
  const freshToken = await createUserSession(user, res);

  return res.json({
    ok: true,
    sessionToken: freshToken,
    user: sanitizeUserForClient(user),
  });
});

authRouter.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const db = await loadDb();
  const activeAdminEmail = getActiveSuperAdminEmail(db);
  const matchedAdmin = db.users.find((u) => u.role === 'super_admin' && u.email.toLowerCase() === normalizedEmail);

  if (matchedAdmin || normalizedEmail === activeAdminEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'Super Admin must authenticate via the dedicated Super Admin Portal.',
      useAdminPortal: true,
    });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  const reg = db.registrations.find((r) => r.email.toLowerCase() === normalizedEmail);

  if (!user) {
    if (reg) {
      if (reg.status === 'Rejected') {
        return res.status(403).json({
          error: REJECTED_ACCESS_MESSAGE,
          registrationStatus: 'Rejected',
          registrationId: reg.id,
        });
      }
      if (reg.status === 'Pending Approval' || reg.status === 'Info Requested') {
        return res.status(403).json({
          error: PENDING_ACCESS_MESSAGE,
          registrationStatus: reg.status,
          registrationId: reg.id,
        });
      }
      return res.status(403).json({
        error: `Your workspace access request (${reg.id}) has status "${reg.status}". Please check your email for activation instructions.`,
        registrationStatus: reg.status,
        registrationId: reg.id,
      });
    }
    return res.status(401).json({
      error: 'No approved workspace account found for this email. New users must click Request Workspace Access and complete the 6-step registration.',
      needsRegistration: true,
    });
  }

  if (user.status !== 'active') {
    appendAuditLog(db, user.email, user.role, 'BUILDER_LOGIN_BLOCKED', user.status, 'Denied');
    await persistDb(db);

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: REJECTED_ACCESS_MESSAGE,
        accountStatus: user.status,
        registrationStatus: 'Rejected',
        registrationId: user.registrationId,
      });
    }
    if (user.status === 'pending_approval') {
      return res.status(403).json({
        error: PENDING_ACCESS_MESSAGE,
        accountStatus: user.status,
        registrationStatus: 'Pending Approval',
        registrationId: user.registrationId,
      });
    }
    if (user.status === 'approved_pending_activation') {
      return res.status(403).json({
        error:
          'Your request is approved and awaiting account activation. Please open the single-use activation link sent to your email to set your password.',
        accountStatus: user.status,
        registrationStatus: 'Approved — Awaiting Activation',
        registrationId: user.registrationId,
      });
    }
    return res.status(403).json({
      error: `Account status is "${user.status}". Contact Aegion AI support for assistance.`,
      accountStatus: user.status,
      registrationStatus: reg?.status,
    });
  }

  if (!user.passwordHash || !verifyPassword(String(password || ''), user.passwordHash)) {
    appendAuditLog(db, user.email, user.role, 'BUILDER_LOGIN', 'Invalid password', 'Denied');
    await persistDb(db);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  user.lastLoginAt = new Date().toISOString();
  appendAuditLog(db, user.email, user.role, 'BUILDER_LOGIN', user.email, 'Allowed');
  await persistDb(db);

  const sessionToken = await createUserSession(user, res);
  return res.json({
    sessionToken,
    user: sanitizeUserForClient(user),
  });
});

authRouter.post('/google', authRateLimiter, async (req, res) => {
  const { idToken, portalMode } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'Firebase ID token is required for Google verification.' });
  }

  const apiKey = await getFirebaseApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'Firebase client configuration missing on server.' });
  }

  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!verifyRes.ok) {
    return res.status(401).json({ error: 'Google ID token verification failed.' });
  }

  const verifiedData = (await verifyRes.json()) as {
    users?: { email?: string; displayName?: string; photoUrl?: string; emailVerified?: boolean }[];
  };
  const verifiedAccount = verifiedData.users?.[0];
  if (!verifiedAccount?.email) {
    return res.status(401).json({ error: 'Verified Google account did not include an email address.' });
  }

  const email = verifiedAccount.email.trim().toLowerCase();
  const displayName = verifiedAccount.displayName || email.split('@')[0];
  const avatarUrl = verifiedAccount.photoUrl || undefined;

  const db = await loadDb();
  const activeAdminEmail = getActiveSuperAdminEmail(db);

  if (email === activeAdminEmail.toLowerCase() || portalMode === 'admin') {
    return res.status(403).json({
      error: 'Super Admin access requires email and password login on the Super Admin Portal.',
    });
  }

  const existingUser = db.users.find((u) => u.email.toLowerCase() === email);
  if (existingUser) {
    if (existingUser.role === 'super_admin') {
      return res.status(403).json({
        error: 'Super Admin must authenticate using email and password only.',
      });
    }
    if (existingUser.status === 'active') {
      existingUser.avatarUrl = avatarUrl || existingUser.avatarUrl;
      existingUser.lastLoginAt = new Date().toISOString();
      appendAuditLog(db, existingUser.email, existingUser.role, 'GOOGLE_SIGN_IN', existingUser.email, 'Allowed');
      await persistDb(db);
      const sessionToken = await createUserSession(existingUser, res);
      return res.json({
        status: 'authenticated',
        sessionToken,
        user: sanitizeUserForClient(existingUser),
      });
    }

    const message =
      existingUser.status === 'rejected'
        ? REJECTED_ACCESS_MESSAGE
        : existingUser.status === 'approved_pending_activation'
        ? 'Your request has been approved and is awaiting account activation. Please open the activation link sent to your email.'
        : PENDING_ACCESS_MESSAGE;

    return res.json({
      status: 'pending_approval',
      accountStatus: existingUser.status,
      registrationStatus:
        existingUser.status === 'rejected'
          ? 'Rejected'
          : existingUser.status === 'approved_pending_activation'
          ? 'Approved — Awaiting Activation'
          : 'Pending Approval',
      message,
      email,
      name: existingUser.name,
      registrationId: existingUser.registrationId,
    });
  }

  const existingReg = db.registrations.find((r) => r.email.toLowerCase() === email);
  if (existingReg) {
    const message =
      existingReg.status === 'Rejected'
        ? REJECTED_ACCESS_MESSAGE
        : PENDING_ACCESS_MESSAGE;
    return res.json({
      status: 'pending_approval',
      registrationStatus: existingReg.status,
      registrationId: existingReg.id,
      message,
      email: existingReg.email,
      name: existingReg.fullName,
      adminComments: existingReg.adminComments,
    });
  }

  return res.json({
    status: 'needs_registration',
    profile: {
      email,
      fullName: displayName,
      avatarUrl,
    },
  });
});

authRouter.post('/activate', authRateLimiter, async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Activation token is required.' });
  }

  const strength = validateStrongPassword(String(password || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' '), details: strength.errors });
  }

  const tokenHash = sha256Hex(token.trim());
  const db = await loadDb();
  const record = db.oneTimeTokens.find(
    (t) => t.tokenHash === tokenHash && t.purpose === 'activation'
  );

  if (!record) {
    return res.status(400).json({ error: 'Invalid activation token.' });
  }
  if (record.usedAt) {
    return res.status(400).json({ error: 'This activation link has already been used.' });
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'This activation link has expired. Ask the Super Admin to re-issue.' });
  }

  const user = db.users.find((u) => u.id === record.userId);
  if (!user) {
    return res.status(404).json({ error: 'Associated user account not found.' });
  }

  const now = new Date().toISOString();
  record.usedAt = now;
  user.passwordHash = hashPassword(String(password));
  user.status = 'active';
  user.mustChangePassword = false;
  user.updatedAt = now;
  user.lastLoginAt = now;

  if (record.registrationId) {
    const reg = db.registrations.find((r) => r.id === record.registrationId);
    if (reg) {
      reg.accountStatus = 'Active';
    }
    db.approvalHistory.unshift({
      id: `APR-${Math.floor(1000 + Math.random() * 9000)}`,
      registrationId: record.registrationId,
      email: user.email,
      previousStatus: 'Approved',
      newStatus: 'Approved',
      action: 'ACTIVATE',
      adminId: user.email,
      timestamp: now,
      comments: 'Account activated and password set via single-use link.',
    });
  }

  appendAuditLog(db, user.email, user.role, 'ACTIVATE_ACCOUNT', user.email, 'Allowed');
  await persistDb(db);

  await dispatchEmailNotification({
    registrationId: record.registrationId || user.id,
    recipient: user.email,
    template: 'Account Activated',
    subject: 'Aegion AI — Your Workspace Account Is Now Active',
    htmlBody: `<p>Hello ${user.name},</p><p>Your Aegion AI account is now active. You can sign in and access your application builder workspace.</p>`,
  });

  const sessionToken = await createUserSession(user, res);
  return res.json({
    ok: true,
    sessionToken,
    user: sanitizeUserForClient(user),
  });
});

authRouter.post('/forgot-password', authRateLimiter, async (req, res) => {
  const { email } = req.body || {};
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const db = await loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);

  if (user && user.status === 'active' && user.role !== 'super_admin') {
    const rawToken = generateSecureToken(24);
    db.oneTimeTokens.push({
      tokenHash: sha256Hex(rawToken),
      userId: user.id,
      email: user.email,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    });
    await persistDb(db);

    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    await dispatchEmailNotification({
      registrationId: user.registrationId || user.id,
      recipient: user.email,
      template: 'Password Reset',
      subject: 'Aegion AI — Password Reset Instructions',
      htmlBody: `<p>Use this single-use link within 30 minutes to reset your password: <a href="${appUrl}/?reset=${rawToken}">${appUrl}/?reset=${rawToken}</a></p>`,
    });
  }

  return res.json({
    ok: true,
    message: 'If an active workspace account matches that email, password reset instructions have been queued.',
  });
});

authRouter.post('/reset-password', authRateLimiter, async (req, res) => {
  const { token, password } = req.body || {};
  const strength = validateStrongPassword(String(password || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' ') });
  }
  const tokenHash = sha256Hex(String(token || ''));
  const db = await loadDb();
  const rec = db.oneTimeTokens.find(
    (t) => t.tokenHash === tokenHash && t.purpose === 'password_reset' && !t.usedAt
  );
  if (!rec || new Date(rec.expiresAt).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }
  const user = db.users.find((u) => u.id === rec.userId);
  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }
  rec.usedAt = new Date().toISOString();
  user.passwordHash = hashPassword(String(password));
  user.updatedAt = rec.usedAt;
  appendAuditLog(db, user.email, user.role, 'PASSWORD_RESET', user.email, 'Allowed');
  await persistDb(db);
  await revokeUserSessions(user.id);
  return res.json({ ok: true });
});
