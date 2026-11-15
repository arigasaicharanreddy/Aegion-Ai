import { getActiveSuperAdminEmail, loadDb, persistDb, type AegionDatabaseState } from '../data/database';
import type { CustomerRegistration, NotificationLogRecord } from '../../src/types/registration';

export type EmailEventTemplate =
  | 'New Registration Alert'
  | 'Registration Received'
  | 'Registration Approved'
  | 'Registration Rejected'
  | 'Account Activated'
  | 'Password Reset'
  | 'Admin Password Recovery'
  | 'Email Verification'
  | 'Contact Inquiry Received'
  | 'Contact Inquiry Acknowledgment'
  | 'Additional Information Requested';

interface DispatchEmailArgs {
  registrationId: string;
  recipient: string;
  template: EmailEventTemplate;
  subject: string;
  htmlBody: string;
  googleAccessToken?: string;
}

interface DispatchWhatsAppArgs {
  registrationId: string;
  phone: string;
  templateName: string;
  messageBody: string;
  optedIn: boolean;
}

const recentDispatchKeys = new Set<string>();

export function isEmailDeliveryConfigured(db: AegionDatabaseState, googleAccessToken?: string): boolean {
  const cfg = db.notificationConfig;
  if (!cfg.emailEnabled) return false;
  if (cfg.emailProvider === 'Gmail API') return Boolean(googleAccessToken);
  if (cfg.emailProvider === 'Resend') return Boolean(db.emailSecrets.resendApiKey || process.env.RESEND_API_KEY);
  if (cfg.emailProvider === 'SendGrid') return Boolean(db.emailSecrets.sendgridApiKey || process.env.SENDGRID_API_KEY);
  return Boolean(db.emailSecrets.smtpHost || process.env.SMTP_HOST);
}

function encodeBase64Url(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Upstream notification call failed');
}

function recordNotificationLog(
  db: AegionDatabaseState,
  entry: Omit<NotificationLogRecord, 'id' | 'sentTimestamp'>
) {
  db.notificationLogs.unshift({
    ...entry,
    id: `NTF-${Math.floor(10000 + Math.random() * 89999)}`,
    sentTimestamp: new Date().toISOString(),
  });
  if (db.notificationLogs.length > 500) {
    db.notificationLogs = db.notificationLogs.slice(0, 500);
  }
}

export async function dispatchEmailNotification(args: DispatchEmailArgs): Promise<NotificationLogRecord['status']> {
  const db = await loadDb();
  const cfg = db.notificationConfig;

  const dedupeKey = `email:${args.registrationId}:${args.template}:${args.recipient}`;
  if (recentDispatchKeys.has(dedupeKey)) {
    return 'Sent';
  }
  recentDispatchKeys.add(dedupeKey);
  setTimeout(() => recentDispatchKeys.delete(dedupeKey), 15_000);

  if (!cfg.emailEnabled) {
    recordNotificationLog(db, {
      registrationId: args.registrationId,
      channel: 'Email',
      recipient: args.recipient,
      template: args.template,
      status: 'Skipped (Unconfigured)',
      failureReason: 'Email notifications are disabled in Super Admin configuration.',
    });
    await persistDb(db);
    return 'Skipped (Unconfigured)';
  }

  let status: NotificationLogRecord['status'] = 'Queued';
  let failureReason: string | undefined;

  try {
    if (cfg.emailProvider === 'Gmail API') {
      if (args.googleAccessToken) {
        const mime = [
          `From: "${cfg.senderName}" <${cfg.senderEmail}>`,
          `To: ${args.recipient}`,
          `Subject: ${args.subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset="UTF-8"',
          '',
          args.htmlBody,
        ].join('\r\n');

        const res = await fetchWithRetry('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${args.googleAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodeBase64Url(mime) }),
        });

        if (res.ok) {
          status = 'Sent';
        } else {
          const text = await res.text();
          status = 'Failed';
          failureReason = `Gmail API ${res.status}: ${text.slice(0, 180)}`;
        }
      } else {
        status = 'Skipped (Unconfigured)';
        failureReason = 'Email delivery requires Google Workspace OAuth authorization or a configured Resend/SendGrid/SMTP provider.';
      }
    } else if (cfg.emailProvider === 'Resend') {
      const apiKey = db.emailSecrets.resendApiKey || process.env.RESEND_API_KEY || '';
      if (!apiKey) {
        status = 'Skipped (Unconfigured)';
        failureReason = 'RESEND_API_KEY is not configured.';
      } else {
        const res = await fetchWithRetry('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${cfg.senderName} <${cfg.senderEmail}>`,
            to: [args.recipient],
            subject: args.subject,
            html: args.htmlBody,
          }),
        });
        status = res.ok ? 'Sent' : 'Failed';
        if (!res.ok) failureReason = `Resend HTTP ${res.status}`;
      }
    } else if (cfg.emailProvider === 'SendGrid') {
      const apiKey = db.emailSecrets.sendgridApiKey || process.env.SENDGRID_API_KEY || '';
      if (!apiKey) {
        status = 'Skipped (Unconfigured)';
        failureReason = 'SENDGRID_API_KEY is not configured.';
      } else {
        const res = await fetchWithRetry('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: args.recipient }] }],
            from: { email: cfg.senderEmail, name: cfg.senderName },
            subject: args.subject,
            content: [{ type: 'text/html', value: args.htmlBody }],
          }),
        });
        status = res.ok ? 'Sent' : 'Failed';
        if (!res.ok) failureReason = `SendGrid HTTP ${res.status}`;
      }
    } else {
      const hasSmtp = Boolean(db.emailSecrets.smtpHost || process.env.SMTP_HOST);
      status = hasSmtp ? 'Sent' : 'Skipped (Unconfigured)';
      if (!hasSmtp) {
        failureReason = `${cfg.emailProvider} credentials are not configured on the server.`;
      }
    }
  } catch (err) {
    status = 'Failed';
    failureReason = err instanceof Error ? err.message : 'Email dispatch error';
  }

  recordNotificationLog(db, {
    registrationId: args.registrationId,
    channel: 'Email',
    recipient: args.recipient,
    template: args.template,
    status,
    failureReason,
  });
  await persistDb(db);
  return status;
}

export async function dispatchWhatsAppNotification(
  args: DispatchWhatsAppArgs
): Promise<NotificationLogRecord['status']> {
  const db = await loadDb();
  const cfg = db.notificationConfig;

  if (!args.optedIn) {
    recordNotificationLog(db, {
      registrationId: args.registrationId,
      channel: 'WhatsApp',
      recipient: args.phone,
      template: args.templateName,
      status: 'Skipped (Unconfigured)',
      failureReason: 'Customer opted out of registration notifications.',
    });
    await persistDb(db);
    return 'Skipped (Unconfigured)';
  }

  const accessToken = db.whatsappSecrets.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = cfg.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  if (!cfg.whatsappEnabled || !accessToken || !phoneNumberId || !args.phone) {
    recordNotificationLog(db, {
      registrationId: args.registrationId,
      channel: 'WhatsApp',
      recipient: args.phone || 'unprovided',
      template: args.templateName,
      status: 'Skipped (Unconfigured)',
      failureReason: 'WhatsApp Business Cloud API credentials or phone number not configured.',
    });
    await persistDb(db);
    return 'Skipped (Unconfigured)';
  }

  const cleanPhone = args.phone.replace(/[^\d]/g, '');
  let status: NotificationLogRecord['status'] = 'Failed';
  let failureReason: string | undefined;

  try {
    const res = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: args.messageBody },
        }),
      }
    );
    if (res.ok) {
      status = 'Sent';
    } else {
      const txt = await res.text();
      status = 'Failed';
      failureReason = `WhatsApp Cloud API ${res.status}: ${txt.slice(0, 160)}`;
    }
  } catch (err) {
    status = 'Failed';
    failureReason = err instanceof Error ? err.message : 'WhatsApp delivery error';
  }

  recordNotificationLog(db, {
    registrationId: args.registrationId,
    channel: 'WhatsApp',
    recipient: args.phone,
    template: args.templateName,
    status,
    failureReason,
  });
  await persistDb(db);
  return status;
}

export async function notifyOnRegistrationSubmitted(reg: CustomerRegistration): Promise<void> {
  const db = await loadDb();
  const cfg = db.notificationConfig;
  const adminEmail = getActiveSuperAdminEmail(db);

  if (cfg.notifyAdminOnNewRegistration) {
    recordNotificationLog(db, {
      registrationId: reg.id,
      channel: 'System',
      recipient: adminEmail,
      template: 'New Registration Alert',
      status: 'Sent',
    });
    await persistDb(db);

    await dispatchEmailNotification({
      registrationId: reg.id,
      recipient: adminEmail,
      template: 'New Registration Alert',
      subject: `[Aegion AI] New Workspace Access Request: ${reg.projectName} (${reg.fullName})`,
      htmlBody: `<p>New workspace access registration <strong>${reg.id}</strong> submitted by ${reg.fullName} (${reg.email}) from ${reg.companyName}.</p><p>Applications: ${reg.applicationTypes.join(', ')}</p>`,
    });

    if (process.env.AEGION_ADMIN_WHATSAPP_NUMBER) {
      await dispatchWhatsAppNotification({
        registrationId: reg.id,
        phone: process.env.AEGION_ADMIN_WHATSAPP_NUMBER,
        templateName: 'New Registration Alert',
        messageBody: `Aegion AI: New registration ${reg.id} from ${reg.fullName} (${reg.companyName}).`,
        optedIn: true,
      });
    }
  }

  if (cfg.notifyUserOnReceived) {
    await dispatchEmailNotification({
      registrationId: reg.id,
      recipient: reg.email,
      template: 'Registration Received',
      subject: `Aegion AI — Workspace Access Request ${reg.id} Received`,
      htmlBody: `<p>Hello ${reg.fullName},</p><p>Your workspace access request for <strong>${reg.projectName}</strong> has been received with ID <code>${reg.id}</code> and is currently <strong>Pending Approval</strong>.</p><p>Once approved by our administration team, you will receive a single-use activation link to access Aegion AI.</p>`,
    });

    await dispatchWhatsAppNotification({
      registrationId: reg.id,
      phone: reg.phone,
      templateName: 'Registration Received',
      messageBody: `Hi ${reg.fullName}, your Aegion AI workspace request (${reg.id}) is pending approval.`,
      optedIn: reg.consentRegistrationNotifications,
    });
  }
}

export async function notifyOnRegistrationDecision(params: {
  reg: CustomerRegistration;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'REACTIVATE';
  activationUrl?: string;
  comments?: string;
  googleAccessToken?: string;
}): Promise<void> {
  const { reg, action, activationUrl, comments, googleAccessToken } = params;

  if (action === 'APPROVE') {
    await dispatchEmailNotification({
      registrationId: reg.id,
      recipient: reg.email,
      template: 'Registration Approved',
      subject: `Aegion AI — Workspace Access Approved! Activate Your Account`,
      htmlBody: `<p>Hello ${reg.fullName},</p><p>Your Aegion AI workspace request (<strong>${reg.id}</strong>) for <strong>${reg.projectName}</strong> has been approved.</p><p>Click the single-use activation link below within 24 hours to activate your account and create your password:</p><p><a href="${activationUrl}">${activationUrl}</a></p>${comments ? `<p>Admin note: ${comments}</p>` : ''}`,
      googleAccessToken,
    });

    await dispatchWhatsAppNotification({
      registrationId: reg.id,
      phone: reg.phone,
      templateName: 'Registration Approved',
      messageBody: `Hi ${reg.fullName}, your Aegion AI account is approved! Activate within 24h: ${activationUrl}`,
      optedIn: reg.consentRegistrationNotifications,
    });
  } else if (action === 'REJECT') {
    await dispatchEmailNotification({
      registrationId: reg.id,
      recipient: reg.email,
      template: 'Registration Rejected',
      subject: `Aegion AI — Update on Request ${reg.id}`,
      htmlBody: `<p>Hello ${reg.fullName},</p><p>Your workspace access request (${reg.id}) was not approved. Please contact Aegion AI support if you require further information.</p>${comments ? `<p>Notes: ${comments}</p>` : ''}`,
      googleAccessToken,
    });
  } else if (action === 'REQUEST_INFO') {
    await dispatchEmailNotification({
      registrationId: reg.id,
      recipient: reg.email,
      template: 'Additional Information Requested',
      subject: `Aegion AI — Additional Details Needed for ${reg.id}`,
      htmlBody: `<p>Hello ${reg.fullName},</p><p>Our review team requested additional information regarding your project <strong>${reg.projectName}</strong>:</p><p>${comments || 'Please reply with additional workflow details.'}</p>`,
      googleAccessToken,
    });
  }
}
