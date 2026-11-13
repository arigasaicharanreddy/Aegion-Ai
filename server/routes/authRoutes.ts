import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appendAuditLog, loadDb, persistDb } from '../data/database';
import {
  createUserSession,
  requireSession,
  resolveSessionUser,
  revokeUserSessions,
  sanitizeUserForClient,
  SESSION_COOKIE_NAME,
  type AuthenticatedRequest,
} from '../middleware/auth';
import { SUPER_ADMIN_EMAIL } from '../security/bootstrap';
import {
  createRateLimiter,
  generateSecureToken,
  hashPassword,
  sha256Hex,
  validateStrongPassword,
  verifyPassword,
} from '../security/crypto';
import { dispatchEmailNotification } from '../services/notificationService';

export const authRouter = Router();

const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  keyPrefix: 'auth',
});

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

authRouter.get('/me', async (req, res) => {
  const { user, isDevPreview } = await resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  const clientUser = sanitizeUserForClient(user);
  if (isDevPreview) {
    clientUser.mustChangePassword = false;
  }
  return res.json({
    authenticated: true,
    isDevPreview: Boolean(isDevPreview),
    user: clientUser,
  });
});

authRouter.post('/dev-preview-session', async (req, res) => {
  const freeDevMode =
    process.env.NODE_ENV !== 'production' && process.env.AEGION_FREE_DEV_MODE !== 'false';
  if (!freeDevMode) {
    return res.status(403).json({
      error: 'Free development preview session is disabled in production.',
    });
  }

  const requestedRole = req.body?.role === 'super_admin' ? 'super_admin' : 'builder';
  const db = await loadDb();

  const targetUser =
    requestedRole === 'super_admin'
      ? db.users.find((u) => u.role === 'super_admin')
      : db.users.find((u) => u.role === 'builder' && u.status === 'active');

  if (!targetUser) {
    return res.status(404).json({ error: 'Preview account not available.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();
  appendAuditLog(
    db,
    targetUser.email,
    targetUser.role,
    'DEV_PREVIEW_SESSION',
    `Free Dev Mode (${requestedRole})`,
    'Allowed'
  );
  await persistDb(db);

  const sessionToken = await createUserSession(targetUser, res, { isDevPreview: true });
  const clientUser = sanitizeUserForClient(targetUser);
  clientUser.mustChangePassword = false;

  return res.json({
    ok: true,
    isDevPreview: true,
    sessionToken,
    user: clientUser,
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
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ ok: true });
});

authRouter.post('/admin/login', authRateLimiter, async (req, res) => {
  const { email, password, mfaCode } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (normalizedEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    const db = await loadDb();
    appendAuditLog(db, normalizedEmail || 'unknown', 'guest', 'SUPER_ADMIN_LOGIN_ATTEMPT', 'Admin Portal', 'Denied');
    await persistDb(db);
    return res.status(403).json({
      error: 'Only the authorized Super Admin account may sign in through this portal.',
    });
  }

  const db = await loadDb();
  const admin = db.users.find((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
  if (!admin || !admin.passwordHash || !verifyPassword(String(password || ''), admin.passwordHash)) {
    appendAuditLog(db, SUPER_ADMIN_EMAIL, 'super_admin', 'SUPER_ADMIN_LOGIN', 'Invalid Credentials', 'Denied');
    await persistDb(db);
    return res.status(401).json({ error: 'Invalid Super Admin credentials.' });
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
    return res.status(400).json({ error: 'New password must be different from the initial password.' });
  }

  const strength = validateStrongPassword(String(newPassword || ''));
  if (!strength.valid) {
    return res.status(400).json({ error: strength.errors.join(' '), details: strength.errors });
  }

  admin.passwordHash = hashPassword(String(newPassword));
  admin.mustChangePassword = false;
  admin.updatedAt = new Date().toISOString();
  appendAuditLog(db, admin.email, admin.role, 'SUPER_ADMIN_PASSWORD_ROTATED', admin.email, 'Allowed');
  await persistDb(db);

  // Revoke all previous sessions & rotate fresh session token
  await revokeUserSessions(admin.id);
  const freshToken = await createUserSession(admin, res);

  return res.json({
    ok: true,
    sessionToken: freshToken,
    user: sanitizeUserForClient(admin),
  });
});

authRouter.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      error: 'Super Admin must authenticate via the dedicated Super Admin Login portal.',
      useAdminPortal: true,
    });
  }

  const db = await loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  const reg = db.registrations.find((r) => r.email.toLowerCase() === normalizedEmail);

  if (!user) {
    if (reg) {
      return res.status(403).json({
        error: `Your registration (${reg.id}) status is "${reg.status}". Access is unlocked after Super Admin approval and activation.`,
        registrationStatus: reg.status,
        registrationId: reg.id,
      });
    }
    return res.status(401).json({ error: 'No workspace account found for this email.' });
  }

  if (user.status !== 'active') {
    appendAuditLog(db, user.email, user.role, 'BUILDER_LOGIN_BLOCKED', user.status, 'Denied');
    await persistDb(db);
    return res.status(403).json({
      error: `Account status is "${user.status}". Only approved and activated accounts can enter the builder.`,
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

  // Verify Google / Firebase ID token server-side — never trust raw frontend email
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

  // Super Admin must still satisfy password / forced rotation policies unless already rotated
  if (email === SUPER_ADMIN_EMAIL.toLowerCase() && portalMode === 'admin') {
    const admin = db.users.find((u) => u.email.toLowerCase() === email);
    if (!admin) {
      return res.status(403).json({ error: 'Super Admin record not bootstrapped.' });
    }
    if (admin.mustChangePassword) {
      return res.status(403).json({
        error: 'Initial Super Admin bootstrap requires password login and forced password rotation first.',
      });
    }
    admin.avatarUrl = avatarUrl || admin.avatarUrl;
    admin.lastLoginAt = new Date().toISOString();
    appendAuditLog(db, admin.email, admin.role, 'SUPER_ADMIN_GOOGLE_LOGIN', admin.email, 'Allowed');
    await persistDb(db);
    const sessionToken = await createUserSession(admin, res);
    return res.json({ status: 'authenticated', sessionToken, user: sanitizeUserForClient(admin) });
  }

  const existingUser = db.users.find((u) => u.email.toLowerCase() === email);
  if (existingUser) {
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
    return res.json({
      status: 'pending_approval',
      accountStatus: existingUser.status,
      email,
      name: existingUser.name,
      registrationId: existingUser.registrationId,
    });
  }

  const existingReg = db.registrations.find((r) => r.email.toLowerCase() === email);
  if (existingReg) {
    return res.json({
      status: 'pending_approval',
      registrationStatus: existingReg.status,
      registrationId: existingReg.id,
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
    subject: 'Aegion AI — Your Builder Account Is Now Active',
    htmlBody: `<p>Hello ${user.name},</p><p>Your Aegion AI builder account is now active. You can launch the Application Builder Studio and export multi-language projects.</p>`,
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

  if (user && user.status === 'active') {
    const rawToken = generateSecureToken(24);
    db.oneTimeTokens.push({
      tokenHash: sha256Hex(rawToken),
      userId: user.id,
      email: user.email,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    });
    await persistDb(db);

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
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
  await persistDb(db);
  await revokeUserSessions(user.id);
  return res.json({ ok: true });
});
