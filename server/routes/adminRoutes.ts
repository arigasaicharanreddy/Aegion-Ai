import { Router } from 'express';
import * as XLSX from 'xlsx';
import { appendAuditLog, loadDb, persistDb } from '../data/database';
import { requireSuperAdmin, sanitizeUserForClient, type AuthenticatedRequest } from '../middleware/auth';
import { generateSecureToken, sha256Hex } from '../security/crypto';
import { syncAllToGoogleSheets } from '../services/googleSheetsService';
import {
  dispatchEmailNotification,
  dispatchWhatsAppNotification,
  isEmailDeliveryConfigured,
  notifyOnRegistrationDecision,
} from '../services/notificationService';
import type { ContactInquiryStatus, RegistrationStatus } from '../../src/types/registration';
import { isValidPlatformThemeId, PLATFORM_THEME_CATEGORIES } from '../../src/platform-themes/catalog';

export const adminRouter = Router();

// Every single route in adminRouter requires verified super_admin session
adminRouter.use(requireSuperAdmin);

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildXlsxBuffer(sheetName: string, headers: string[], rows: unknown[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

adminRouter.get('/overview', async (req: AuthenticatedRequest, res) => {
  const db = await loadDb();
  const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;

  const totalRegistrations = db.registrations.length;
  const pendingApprovals = db.registrations.filter(
    (r) => r.status === 'Pending Approval' || r.status === 'Info Requested'
  ).length;
  const approvedUsers = db.registrations.filter((r) => r.status === 'Approved').length;
  const activeUsers = db.users.filter((u) => u.status === 'active' && u.role !== 'super_admin').length;
  const rejectedRegistrations = db.registrations.filter((r) => r.status === 'Rejected').length;
  const contactInquiriesCount = db.contactInquiries.length;

  const totalNotifications = db.notificationLogs.length;
  const sentNotifications = db.notificationLogs.filter((n) => n.status === 'Sent').length;
  const deliveryRate = totalNotifications > 0 ? Math.round((sentNotifications / totalNotifications) * 100) : 100;

  const emailConfigured = isEmailDeliveryConfigured(db, googleAccessToken);
  const whatsappConfigured = Boolean(
    (db.whatsappSecrets.accessToken || process.env.WHATSAPP_ACCESS_TOKEN) &&
      (db.notificationConfig.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID)
  );

  const enrichedRegistrations = db.registrations.map((reg) => {
    const user = db.users.find(
      (u) => u.email.toLowerCase() === reg.email.toLowerCase() || u.registrationId === reg.id
    );
    const displayStatus =
      reg.status === 'Rejected'
        ? 'Rejected'
        : reg.status === 'Suspended' || user?.status === 'suspended'
        ? 'Suspended'
        : user?.status === 'active'
        ? 'Active'
        : reg.status === 'Approved'
        ? 'Approved — Awaiting Activation'
        : reg.status;
    return {
      ...reg,
      accountStatus: displayStatus,
    };
  });

  return res.json({
    kpis: {
      totalRegistrations,
      pendingApprovals,
      approvedUsers,
      activeUsers,
      rejectedRegistrations,
      contactInquiriesCount,
      activeProjects: db.aiStats.activeProjects,
      applicationsGenerated: db.aiStats.applicationsGenerated,
      failedGenerations: db.aiStats.failedGenerations,
      tokensConsumed: db.aiStats.tokensConsumed,
      notificationDeliveryRate: deliveryRate,
      recentActivitiesCount: db.auditLogs.length,
    },
    emailConfigured,
    whatsappConfigured,
    registrations: enrichedRegistrations,
    contactInquiries: db.contactInquiries,
    approvalHistory: db.approvalHistory,
    notificationLogs: db.notificationLogs,
    users: db.users.map(sanitizeUserForClient),
    auditLogs: db.auditLogs,
    supportTickets: db.supportTickets,
    notificationConfig: db.notificationConfig,
    platformThemeConfig: db.platformThemeConfig,
  });
});

adminRouter.post('/registrations/:id/decision', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const regId = req.params.id;
  const { decision, comments = '' } = req.body || {};
  const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;

  const validDecisions = new Set(['approve', 'reject', 'request_info', 'suspend', 'reactivate']);
  if (!validDecisions.has(decision)) {
    return res.status(400).json({ error: 'Invalid decision action.' });
  }

  const db = await loadDb();
  const reg = db.registrations.find((r) => r.id === regId);
  if (!reg) {
    return res.status(404).json({ error: 'Registration not found.' });
  }

  const previousStatus = reg.status;
  const now = new Date().toISOString();
  let nextStatus: RegistrationStatus = reg.status;
  let actionType: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'REACTIVATE' = 'APPROVE';
  let activationLink: string | undefined;

  if (decision === 'approve') {
    nextStatus = 'Approved';
    actionType = 'APPROVE';
    reg.approvalDate = now;
    reg.approvedBy = admin.email;
  } else if (decision === 'reject') {
    nextStatus = 'Rejected';
    actionType = 'REJECT';
  } else if (decision === 'request_info') {
    nextStatus = 'Info Requested';
    actionType = 'REQUEST_INFO';
  } else if (decision === 'suspend') {
    nextStatus = 'Suspended';
    actionType = 'SUSPEND';
  } else if (decision === 'reactivate') {
    nextStatus = 'Approved';
    actionType = 'REACTIVATE';
  }

  reg.status = nextStatus;
  if (comments) reg.adminComments = String(comments).trim();

  let user = db.users.find((u) => u.email.toLowerCase() === reg.email.toLowerCase());
  if (decision === 'approve' || decision === 'reactivate') {
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: reg.fullName,
        email: reg.email,
        role: 'builder',
        status: 'approved_pending_activation',
        mustChangePassword: false,
        mfaEnabled: false,
        authProvider: reg.authProvider === 'google' ? 'google' : 'password',
        workspaceId: `ws-${reg.id.toLowerCase()}`,
        workspaceName: reg.companyName || `${reg.fullName} Workspace`,
        phone: reg.phone,
        companyName: reg.companyName,
        jobTitle: reg.jobTitle,
        country: reg.country,
        platformTheme: {
          themeId: db.platformThemeConfig.defaultUserThemeId,
          animationMode: db.platformThemeConfig.animationsGloballyAllowed ? 'balanced' : 'disabled',
          enable3D: false,
          updatedAt: now,
        },
        registrationId: reg.id,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(user);
    } else if (decision === 'reactivate') {
      user.status = user.passwordHash ? 'active' : 'approved_pending_activation';
      user.updatedAt = now;
    }

    reg.accountStatus = user.status === 'active' ? 'Active' : 'Approved — Awaiting Activation';

    if (decision === 'approve') {
      const rawToken = generateSecureToken(24);
      db.oneTimeTokens.push({
        tokenHash: sha256Hex(rawToken),
        userId: user.id,
        email: user.email,
        registrationId: reg.id,
        purpose: 'activation',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      });
      const origin = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      activationLink = `${origin}/?activate=${rawToken}`;
    }
  } else if (decision === 'suspend' && user) {
    user.status = 'suspended';
    user.updatedAt = now;
    reg.accountStatus = 'Suspended';
    db.sessions = db.sessions.filter((s) => s.userId !== user!.id);
  } else if (decision === 'reject') {
    reg.accountStatus = 'Rejected';
    if (user) {
      user.status = 'rejected';
      user.updatedAt = now;
      db.sessions = db.sessions.filter((s) => s.userId !== user!.id);
    }
  }

  db.approvalHistory.unshift({
    id: `APR-${Math.floor(1000 + Math.random() * 9000)}`,
    registrationId: reg.id,
    email: reg.email,
    previousStatus,
    newStatus: nextStatus,
    action: actionType,
    adminId: admin.email,
    timestamp: now,
    comments: reg.adminComments || `${actionType} executed by Super Admin.`,
  });

  appendAuditLog(db, admin.email, admin.role, `${actionType}_REGISTRATION`, `${reg.id} (${reg.email})`, 'Allowed');
  await persistDb(db);

  await notifyOnRegistrationDecision({
    reg,
    action: actionType,
    activationUrl: activationLink,
    comments: reg.adminComments,
    googleAccessToken,
  });

  if (googleAccessToken) {
    try {
      await syncAllToGoogleSheets(googleAccessToken);
    } catch (err) {
      const latestDb = await loadDb();
      const targetReg = latestDb.registrations.find((r) => r.id === reg.id);
      if (targetReg) {
        targetReg.sheetsSyncError = err instanceof Error ? err.message : 'Sheets sync error';
        await persistDb(latestDb);
      }
    }
  }

  return res.json({
    ok: true,
    registration: reg,
    activationLinkPreview: activationLink,
  });
});

// Super Admin ONLY: Update Contact Inquiry Status / Internal Notes
adminRouter.put('/contacts/:id', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const inquiryId = req.params.id;
  const { status, adminNotes } = req.body || {};

  const validStatuses = new Set<ContactInquiryStatus>(['New', 'In Review', 'Resolved']);
  if (status && !validStatuses.has(status)) {
    return res.status(400).json({ error: 'Invalid inquiry status.' });
  }

  const db = await loadDb();
  const inquiry = db.contactInquiries.find((c) => c.id === inquiryId);
  if (!inquiry) {
    return res.status(404).json({ error: 'Contact inquiry not found.' });
  }

  if (status) {
    inquiry.status = status;
    if (status === 'Resolved' && !inquiry.responseDate) {
      inquiry.responseDate = new Date().toISOString();
    }
  }
  if (typeof adminNotes === 'string') {
    inquiry.adminNotes = adminNotes.trim();
  }
  inquiry.sheetsSynced = false;

  appendAuditLog(db, admin.email, admin.role, 'UPDATE_CONTACT_INQUIRY', `${inquiry.id} -> ${inquiry.status}`, 'Allowed');
  await persistDb(db);

  return res.json({ ok: true, inquiry });
});

// Super Admin ONLY: CSV or XLSX export of platform registrations
adminRouter.get('/registrations/export', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
  const db = await loadDb();

  const headers = [
    'Registration ID',
    'Submission Date',
    'Full Name',
    'Email',
    'Phone',
    'Country',
    'Company Name',
    'Company Website',
    'Job Title',
    'Application Types',
    'Project Name',
    'Project Description',
    'Preferred Backend Language',
    'Preferred Frontend Framework',
    'Theme Option',
    'Theme Mode Preference',
    'Additional Requirements',
    'Marketing Consent',
    'Approval Status',
    'Approval Date',
    'Admin Comments',
  ];

  const rows = db.registrations.map((r) => [
    r.id,
    r.submissionDate,
    r.fullName,
    r.email,
    r.phone,
    r.country,
    r.companyName,
    r.companyWebsite,
    r.jobTitle,
    r.applicationTypes.join(' | '),
    r.projectName,
    r.projectDescription,
    r.preferredBackendLanguage,
    r.preferredFrontendFramework,
    r.themeOption,
    r.themeModePreference,
    [r.additionalFeatures, r.integrationRequirements, r.additionalComments].filter(Boolean).join(' ; '),
    r.consentMarketing ? 'Yes' : 'No',
    r.accountStatus || r.status,
    r.approvalDate || '',
    r.adminComments || '',
  ]);

  appendAuditLog(
    db,
    admin.email,
    admin.role,
    `EXPORT_REGISTRATIONS_${format.toUpperCase()}`,
    `${db.registrations.length} records`,
    'Allowed'
  );
  await persistDb(db);

  const dateStamp = new Date().toISOString().slice(0, 10);
  if (format === 'xlsx') {
    const buffer = buildXlsxBuffer('Registrations', headers, rows);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AEGION_AI_CUSTOMER_REGISTRATIONS_${dateStamp}.xlsx"`
    );
    return res.send(buffer);
  }

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="AEGION_AI_CUSTOMER_REGISTRATIONS_${dateStamp}.csv"`
  );
  return res.send(csvContent);
});

// Super Admin ONLY: CSV or XLSX export of contact inquiries sheet
adminRouter.get('/contacts/export', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
  const db = await loadDb();

  const headers = [
    'Inquiry ID',
    'Submission Date',
    'Full Name',
    'Business Email',
    'Company Name',
    'Subject',
    'Inquiry Category',
    'Message',
    'Inquiry Status',
    'Admin Notes',
    'Response Date',
  ];

  const rows = db.contactInquiries.map((c) => [
    c.id,
    c.submittedAt,
    c.fullName,
    c.email,
    c.company || '',
    c.subject,
    c.category,
    c.message,
    c.status,
    c.adminNotes || '',
    c.responseDate || '',
  ]);

  appendAuditLog(
    db,
    admin.email,
    admin.role,
    `EXPORT_CONTACTS_${format.toUpperCase()}`,
    `${db.contactInquiries.length} contact records`,
    'Allowed'
  );
  await persistDb(db);

  const dateStamp = new Date().toISOString().slice(0, 10);
  if (format === 'xlsx') {
    const buffer = buildXlsxBuffer('Contact Inquiries', headers, rows);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AEGION_AI_CONTACT_INQUIRIES_${dateStamp}.xlsx"`
    );
    return res.send(buffer);
  }

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="AEGION_AI_CONTACT_INQUIRIES_${dateStamp}.csv"`
  );
  return res.send(csvContent);
});

adminRouter.post('/sheets/sync', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;

  if (!googleAccessToken) {
    return res.status(400).json({
      error: 'Connect Google Workspace OAuth first to authorize Sheets synchronization.',
    });
  }

  try {
    const summary = await syncAllToGoogleSheets(googleAccessToken);
    const db = await loadDb();
    appendAuditLog(
      db,
      admin.email,
      admin.role,
      'SYNC_GOOGLE_SHEETS',
      `Registrations ${summary.spreadsheetId} & Contacts ${summary.contactSpreadsheetId}`,
      'Allowed'
    );
    await persistDb(db);
    return res.json({ ok: true, ...summary });
  } catch (err) {
    const db = await loadDb();
    appendAuditLog(
      db,
      admin.email,
      admin.role,
      'SYNC_GOOGLE_SHEETS',
      err instanceof Error ? err.message : 'Sync error',
      'Denied'
    );
    await persistDb(db);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Google Sheets sync failed.',
    });
  }
});

adminRouter.put('/notifications/config', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const body = req.body || {};
  const db = await loadDb();

  if (body.emailProvider) db.notificationConfig.emailProvider = body.emailProvider;
  if (typeof body.senderEmail === 'string') db.notificationConfig.senderEmail = body.senderEmail.trim();
  if (typeof body.senderName === 'string') db.notificationConfig.senderName = body.senderName.trim();
  if (typeof body.emailEnabled === 'boolean') db.notificationConfig.emailEnabled = body.emailEnabled;
  if (typeof body.whatsappEnabled === 'boolean') db.notificationConfig.whatsappEnabled = body.whatsappEnabled;
  if (typeof body.whatsappBusinessAccountId === 'string') {
    db.notificationConfig.whatsappBusinessAccountId = body.whatsappBusinessAccountId.trim();
  }
  if (typeof body.whatsappPhoneNumberId === 'string') {
    db.notificationConfig.whatsappPhoneNumberId = body.whatsappPhoneNumberId.trim();
  }
  if (typeof body.notifyAdminOnNewRegistration === 'boolean') {
    db.notificationConfig.notifyAdminOnNewRegistration = body.notifyAdminOnNewRegistration;
  }
  if (typeof body.notifyUserOnReceived === 'boolean') {
    db.notificationConfig.notifyUserOnReceived = body.notifyUserOnReceived;
  }
  if (typeof body.notifyUserOnApproval === 'boolean') {
    db.notificationConfig.notifyUserOnApproval = body.notifyUserOnApproval;
  }

  if (typeof body.whatsappAccessToken === 'string' && body.whatsappAccessToken.trim()) {
    db.whatsappSecrets.accessToken = body.whatsappAccessToken.trim();
    db.notificationConfig.whatsappAccessTokenConfigured = true;
  }
  if (typeof body.whatsappWebhookVerifyToken === 'string' && body.whatsappWebhookVerifyToken.trim()) {
    db.whatsappSecrets.webhookVerifyToken = body.whatsappWebhookVerifyToken.trim();
    db.notificationConfig.whatsappWebhookVerifyTokenConfigured = true;
  }
  if (typeof body.resendApiKey === 'string' && body.resendApiKey.trim()) {
    db.emailSecrets.resendApiKey = body.resendApiKey.trim();
  }
  if (typeof body.sendgridApiKey === 'string' && body.sendgridApiKey.trim()) {
    db.emailSecrets.sendgridApiKey = body.sendgridApiKey.trim();
  }

  appendAuditLog(db, admin.email, admin.role, 'UPDATE_NOTIFICATION_CONFIG', db.notificationConfig.emailProvider, 'Allowed');
  await persistDb(db);

  return res.json({ ok: true, notificationConfig: db.notificationConfig });
});

adminRouter.post('/notifications/test', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const { channel, recipient } = req.body || {};
  const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;

  if (channel === 'WhatsApp') {
    const status = await dispatchWhatsAppNotification({
      registrationId: 'TEST-VERIFY',
      phone: String(recipient || ''),
      templateName: 'Test Verification',
      messageBody: 'Aegion AI WhatsApp Cloud API integration verification message.',
      optedIn: true,
    });
    return res.json({ ok: status === 'Sent', status });
  }

  const status = await dispatchEmailNotification({
    registrationId: 'TEST-VERIFY',
    recipient: String(recipient || admin.email),
    template: 'Registration Received',
    subject: 'Aegion AI — Notification Pipeline Test',
    htmlBody: '<p>Your Aegion AI automated email delivery pipeline is configured and operational.</p>',
    googleAccessToken,
  });

  return res.json({ ok: status === 'Sent', status });
});

adminRouter.put('/users/:id/status', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const { status } = req.body || {};
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid target user status.' });
  }

  const db = await loadDb();
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.role === 'super_admin') {
    return res.status(400).json({ error: 'Super Admin account cannot be suspended.' });
  }

  target.status = status;
  target.updatedAt = new Date().toISOString();
  if (status === 'suspended') {
    db.sessions = db.sessions.filter((s) => s.userId !== target.id);
  }
  const linkedReg = db.registrations.find(
    (r) => r.email.toLowerCase() === target.email.toLowerCase() || r.id === target.registrationId
  );
  if (linkedReg) {
    linkedReg.accountStatus = status === 'suspended' ? 'Suspended' : 'Active';
  }
  appendAuditLog(db, admin.email, admin.role, `USER_STATUS_${status.toUpperCase()}`, target.email, 'Allowed');
  await persistDb(db);

  return res.json({ ok: true, user: sanitizeUserForClient(target) });
});

adminRouter.put('/tickets/:id', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const { status } = req.body || {};
  const db = await loadDb();
  const ticket = db.supportTickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  ticket.status = status;
  appendAuditLog(db, admin.email, admin.role, 'UPDATE_SUPPORT_TICKET', `${ticket.id} -> ${status}`, 'Allowed');
  await persistDb(db);
  return res.json({ ok: true, ticket });
});

// Super Admin ONLY: Platform Theme Catalog & Governance Policy
adminRouter.put('/platform-themes/config', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
  const body = req.body || {};
  const db = await loadDb();
  const current = db.platformThemeConfig;

  const nextDefaultPublic =
    typeof body.defaultPublicThemeId === 'string' && isValidPlatformThemeId(body.defaultPublicThemeId)
      ? body.defaultPublicThemeId
      : current.defaultPublicThemeId;
  const nextDefaultUser =
    typeof body.defaultUserThemeId === 'string' && isValidPlatformThemeId(body.defaultUserThemeId)
      ? body.defaultUserThemeId
      : current.defaultUserThemeId;
  const nextDefaultAdmin =
    typeof body.defaultAdminThemeId === 'string' && isValidPlatformThemeId(body.defaultAdminThemeId)
      ? body.defaultAdminThemeId
      : current.defaultAdminThemeId;
  const nextFallback =
    typeof body.fallbackThemeId === 'string' && isValidPlatformThemeId(body.fallbackThemeId)
      ? body.fallbackThemeId
      : current.fallbackThemeId;

  const rawDisabledThemes = Array.isArray(body.disabledThemeIds)
    ? body.disabledThemeIds.filter(
        (id: unknown): id is string =>
          typeof id === 'string' && isValidPlatformThemeId(id) && id !== nextFallback
      )
    : current.disabledThemeIds;

  const validCats = new Set<string>(PLATFORM_THEME_CATEGORIES);
  const rawDisabledCats = Array.isArray(body.disabledCategories)
    ? body.disabledCategories.filter((c: unknown): c is string => typeof c === 'string' && validCats.has(c))
    : current.disabledCategories;

  db.platformThemeConfig = {
    defaultPublicThemeId: nextDefaultPublic,
    defaultUserThemeId: nextDefaultUser,
    defaultAdminThemeId: nextDefaultAdmin,
    fallbackThemeId: nextFallback,
    disabledThemeIds: Array.from(new Set(rawDisabledThemes)),
    disabledCategories: Array.from(new Set(rawDisabledCats)),
    animationsGloballyAllowed:
      typeof body.animationsGloballyAllowed === 'boolean'
        ? body.animationsGloballyAllowed
        : current.animationsGloballyAllowed,
    threeDGloballyAllowed: false,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email,
  };

  appendAuditLog(
    db,
    admin.email,
    admin.role,
    'UPDATE_PLATFORM_THEME_GOVERNANCE',
    `Public:${nextDefaultPublic}, User:${nextDefaultUser}, Disabled:${db.platformThemeConfig.disabledThemeIds.length}`,
    'Allowed'
  );
  await persistDb(db);

  return res.json({
    ok: true,
    config: db.platformThemeConfig,
  });
});
