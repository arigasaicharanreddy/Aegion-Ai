import { loadDb, persistDb } from '../data/database';
import type {
  ApprovalHistoryRecord,
  ContactInquiry,
  CustomerRegistration,
  NotificationLogRecord,
} from '../../src/types/registration';

const REGISTRATIONS_SPREADSHEET_TITLE = 'AEGION_AI_CUSTOMER_REGISTRATIONS';
const CONTACTS_SPREADSHEET_TITLE = 'AEGION_AI_CONTACT_INQUIRIES';

const REGISTRATIONS_HEADERS = [
  'Registration ID',
  'Submission Date',
  'Full Name',
  'Email',
  'Phone',
  'Country',
  'Company Name',
  'Company Website',
  'Job Title',
  'Application Type(s)',
  'Project Name',
  'Project Description',
  'Preferred Backend Language',
  'Preferred Frontend Framework',
  'Theme Option Selected',
  'Theme Mode Preference',
  'Additional Requirements',
  'Marketing Consent',
  'Approval Status',
  'Approval Date',
  'Admin Comments',
];

const APPROVAL_HISTORY_HEADERS = [
  'History ID',
  'Registration ID',
  'User Email',
  'Previous Status',
  'New Status',
  'Admin ID',
  'Timestamp',
  'Comments',
];

const NOTIFICATION_LOGS_HEADERS = [
  'Notification ID',
  'Registration ID',
  'Channel',
  'Recipient',
  'Template',
  'Status',
  'Sent Timestamp',
  'Failure Reason',
];

const CONTACT_INQUIRIES_HEADERS = [
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

async function sheetsFetch(url: string, accessToken: string, init?: RequestInit, retries = 2) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
      if (res.ok) {
        return res.json();
      }
      const errText = await res.text();
      if (res.status >= 500 && attempt < retries) {
        lastErr = new Error(`Google Sheets API ${res.status}: ${errText.slice(0, 240)}`);
      } else {
        throw new Error(`Google Sheets API ${res.status}: ${errText.slice(0, 240)}`);
      }
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error('Google Sheets API request failed');
}

function registrationToRow(reg: CustomerRegistration): string[] {
  return [
    reg.id,
    reg.submissionDate,
    reg.fullName,
    reg.email,
    reg.phone,
    reg.country,
    reg.companyName,
    reg.companyWebsite || '',
    reg.jobTitle,
    reg.applicationTypes.join(', '),
    reg.projectName,
    reg.projectDescription,
    reg.preferredBackendLanguage,
    reg.preferredFrontendFramework,
    reg.themeOption,
    reg.themeModePreference,
    [reg.additionalFeatures, reg.integrationRequirements, reg.additionalComments].filter(Boolean).join(' | '),
    reg.consentMarketing ? 'Yes' : 'No',
    reg.accountStatus || reg.status,
    reg.approvalDate || '',
    reg.adminComments || '',
  ];
}

function historyToRow(h: ApprovalHistoryRecord): string[] {
  return [
    h.id,
    h.registrationId,
    h.email,
    h.previousStatus,
    h.newStatus,
    h.adminId,
    h.timestamp,
    h.comments,
  ];
}

function notificationToRow(n: NotificationLogRecord): string[] {
  return [
    n.id,
    n.registrationId,
    n.channel,
    n.recipient,
    n.template,
    n.status,
    n.sentTimestamp,
    n.failureReason || '',
  ];
}

function contactToRow(c: ContactInquiry): string[] {
  return [
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
  ];
}

async function ensureSpreadsheet(params: {
  accessToken: string;
  existingId: string;
  title: string;
  sheetNames: string[];
}): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const { accessToken, title, sheetNames } = params;
  let spreadsheetId = params.existingId;

  if (spreadsheetId) {
    try {
      const meta = await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,sheets.properties.title`,
        accessToken
      );
      const existingTitles = new Set<string>(
        (meta.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title || '')
      );
      const missing = sheetNames.filter((name) => !existingTitles.has(name));
      if (missing.length > 0) {
        await sheetsFetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
          accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              requests: missing.map((name) => ({ addSheet: { properties: { title: name } } })),
            }),
          }
        );
      }
      return {
        spreadsheetId: meta.spreadsheetId,
        spreadsheetUrl: meta.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${meta.spreadsheetId}/edit`,
      };
    } catch {
      spreadsheetId = '';
    }
  }

  const created = await sheetsFetch('https://sheets.googleapis.com/v4/spreadsheets', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: sheetNames.map((name) => ({ properties: { title: name } })),
    }),
  });

  const newId = created.spreadsheetId as string;
  const newUrl = (created.spreadsheetUrl as string) || `https://docs.google.com/spreadsheets/d/${newId}/edit`;
  return { spreadsheetId: newId, spreadsheetUrl: newUrl };
}

export async function syncAllToGoogleSheets(accessToken: string): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  contactSpreadsheetId: string;
  contactSpreadsheetUrl: string;
  syncedRegistrations: number;
  syncedHistory: number;
  syncedLogs: number;
  syncedContacts: number;
}> {
  const db = await loadDb();

  // 1. Sync AEGION_AI_CUSTOMER_REGISTRATIONS (3 worksheets)
  const regSheet = await ensureSpreadsheet({
    accessToken,
    existingId: db.notificationConfig.sheetsSpreadsheetId,
    title: REGISTRATIONS_SPREADSHEET_TITLE,
    sheetNames: ['Registrations', 'Approval History', 'Notification Logs'],
  });
  db.notificationConfig.sheetsSpreadsheetId = regSheet.spreadsheetId;
  db.notificationConfig.sheetsSpreadsheetUrl = regSheet.spreadsheetUrl;

  const regValues = [REGISTRATIONS_HEADERS, ...db.registrations.map(registrationToRow)];
  const historyValues = [APPROVAL_HISTORY_HEADERS, ...db.approvalHistory.map(historyToRow)];
  const logValues = [NOTIFICATION_LOGS_HEADERS, ...db.notificationLogs.map(notificationToRow)];

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(regSheet.spreadsheetId)}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ranges: ['Registrations!A:U', 'Approval History!A:H', 'Notification Logs!A:H'],
      }),
    }
  );

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(regSheet.spreadsheetId)}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Registrations!A1', values: regValues },
          { range: 'Approval History!A1', values: historyValues },
          { range: 'Notification Logs!A1', values: logValues },
        ],
      }),
    }
  );

  // 2. Sync AEGION_AI_CONTACT_INQUIRIES (dedicated spreadsheet)
  const contactSheet = await ensureSpreadsheet({
    accessToken,
    existingId: db.notificationConfig.contactSpreadsheetId || '',
    title: CONTACTS_SPREADSHEET_TITLE,
    sheetNames: ['Contact Inquiries'],
  });
  db.notificationConfig.contactSpreadsheetId = contactSheet.spreadsheetId;
  db.notificationConfig.contactSpreadsheetUrl = contactSheet.spreadsheetUrl;

  const contactValues = [CONTACT_INQUIRIES_HEADERS, ...db.contactInquiries.map(contactToRow)];
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(contactSheet.spreadsheetId)}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ ranges: ['Contact Inquiries!A:K'] }),
    }
  );

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(contactSheet.spreadsheetId)}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [{ range: 'Contact Inquiries!A1', values: contactValues }],
      }),
    }
  );

  const now = new Date().toISOString();
  db.notificationConfig.lastSheetsSyncAt = now;
  for (const reg of db.registrations) {
    reg.sheetsSynced = true;
    reg.sheetsSyncError = undefined;
  }
  for (const contact of db.contactInquiries) {
    contact.sheetsSynced = true;
  }
  await persistDb(db);

  return {
    spreadsheetId: regSheet.spreadsheetId,
    spreadsheetUrl: regSheet.spreadsheetUrl,
    contactSpreadsheetId: contactSheet.spreadsheetId,
    contactSpreadsheetUrl: contactSheet.spreadsheetUrl,
    syncedRegistrations: db.registrations.length,
    syncedHistory: db.approvalHistory.length,
    syncedLogs: db.notificationLogs.length,
    syncedContacts: db.contactInquiries.length,
  };
}
