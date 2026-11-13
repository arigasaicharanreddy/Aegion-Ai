import { Router } from 'express';
import { appendAuditLog, loadDb, persistDb } from '../data/database';
import { requireSuperAdmin, sanitizeUserForClient, type AuthenticatedRequest } from '../middleware/auth';
import { generateSecureToken, sha256Hex } from '../security/crypto';
import { syncAllToGoogleSheets } from '../services/googleSheetsService';
import { dispatchEmailNotification, dispatchWhatsAppNotification, notifyOnRegistrationDecision } from '../services/notificationService';
import type { RegistrationStatus } from '../../src/types/registration';

export const adminRouter = Router();

// Every single route in adminRouter requires verified super_admin session + rotated password
adminRouter.use(requireSuperAdmin);

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

adminRouter.get('/overview', async (_req: AuthenticatedRequest, res) => {
  const db = await loadDb();

  const totalRegistrations = db.registrations.length;
  const pendingApprovals = db.registrations.filter(
    (r) => r.status === 'Pending Approval' || r.status === 'Info Requested'
  ).length;
  const approvedUsers = db.users.filter((u) => u.status === 'active').length;
  const totalNotifications = db.notificationLogs.length;
  const sentNotifications = db.notificationLogs.filter((n) => n.status === 'Sent').length;
  const deliveryRate = totalNotifications > 0 ? Math.round((sentNotifications / totalNotifications) * 100) : 100;

  return res.json({
    kpis: {
      totalRegistrations,
      pendingApprovals,
      approvedUsers,
      activeProjects: db.aiStats.activeProjects,
      applicationsGenerated: db.aiStats.applicationsGenerated,
      failedGenerations: db.aiStats.failedGenerations,
      tokensConsumed: db.aiStats.tokensConsumed,
      notificationDeliveryRate: deliveryRate,
      recentActivitiesCount: db.auditLogs.length,
    },
    registrations: db.registrations,
    approvalHistory: db.approvalHistory,
    notificationLogs: db.notificationLogs,
    users: db.users.map(sanitizeUserForClient),
    auditLogs: db.auditLogs,
    supportTickets: db.supportTickets,
    notificationConfig: db.notificationConfig,
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

  // Synchronize or create associated user account & single-use activation token
  let user = db.users.find((u) => u.email.toLowerCase() === reg.email.toLowerCase());
  if (decision === 'approve' || decision === 'reactivate') {
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: reg.fullName,
        email: reg.email,
        role: 'builder',
        status: reg.authProvider === 'google' ? 'active' : 'approved_pending_activation',
        mustChangePassword: false,
        mfaEnabled: false,
        authProvider: reg.authProvider === 'google' ? 'google' : 'password',
        workspaceId: `ws-${reg.id.toLowerCase()}`,
        workspaceName: reg.companyName || `${reg.fullName} Workspace`,
        registrationId: reg.id,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(user);
    } else if (decision === 'reactivate') {
      user.status = user.passwordHash || user.authProvider === 'google' ? 'active' : 'approved_pending_activation';
      user.updatedAt = now;
    }

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
    db.sessions = db.sessions.filter((s) => s.userId !== user!.id);
  } else if (decision === 'reject' && user) {
    user.status = 'rejected';
    user.updatedAt = now;
    db.sessions = db.sessions.filter((s) => s.userId !== user!.id);
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

// Super Admin ONLY: CSV export of platform registrations
adminRouter.get('/registrations/export', async (req: AuthenticatedRequest, res) => {
  const admin = req.authUser!;
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
    r.status,
    r.approvalDate || '',
    r.adminComments || '',
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  appendAuditLog(
    db,
    admin.email,
    admin.role,
    'EXPORT_REGISTRATIONS_CSV',
    `${db.registrations.length} records`,
    'Allowed'
  );
  await persistDb(db);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="AEGION_AI_CUSTOMER_REGISTRATIONS_${new Date().toISOString().slice(0, 10)}.csv"`
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
      `Spreadsheet ${summary.spreadsheetId}`,
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

  // Server-only secrets (never returned raw to frontend)
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
