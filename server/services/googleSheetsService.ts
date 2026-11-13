import { loadDb, persistDb } from '../data/database';
import type {
  ApprovalHistoryRecord,
  CustomerRegistration,
  NotificationLogRecord,
} from '../../src/types/registration';

const SPREADSHEET_TITLE = 'AEGION_AI_CUSTOMER_REGISTRATIONS';

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

async function sheetsFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API ${res.status}: ${errText.slice(0, 240)}`);
  }
  return res.json();
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
    reg.status,
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

async function ensureSpreadsheet(accessToken: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const db = await loadDb();
  let spreadsheetId = db.notificationConfig.sheetsSpreadsheetId;

  if (spreadsheetId) {
    try {
      const meta = await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,sheets.properties.title`,
        accessToken
      );
      const existingTitles = new Set<string>(
        (meta.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title || '')
      );

      const missing = ['Registrations', 'Approval History', 'Notification Logs'].filter(
        (title) => !existingTitles.has(title)
      );
      if (missing.length > 0) {
        await sheetsFetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
          accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
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
      properties: { title: SPREADSHEET_TITLE },
      sheets: [
        { properties: { title: 'Registrations' } },
        { properties: { title: 'Approval History' } },
        { properties: { title: 'Notification Logs' } },
      ],
    }),
  });

  const newId = created.spreadsheetId as string;
  const newUrl = (created.spreadsheetUrl as string) || `https://docs.google.com/spreadsheets/d/${newId}/edit`;

  db.notificationConfig.sheetsSpreadsheetId = newId;
  db.notificationConfig.sheetsSpreadsheetUrl = newUrl;
  await persistDb(db);

  return { spreadsheetId: newId, spreadsheetUrl: newUrl };
}

export async function syncAllToGoogleSheets(accessToken: string): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedRegistrations: number;
  syncedHistory: number;
  syncedLogs: number;
}> {
  const db = await loadDb();
  const { spreadsheetId, spreadsheetUrl } = await ensureSpreadsheet(accessToken);

  const regValues = [REGISTRATIONS_HEADERS, ...db.registrations.map(registrationToRow)];
  const historyValues = [APPROVAL_HISTORY_HEADERS, ...db.approvalHistory.map(historyToRow)];
  const logValues = [NOTIFICATION_LOGS_HEADERS, ...db.notificationLogs.map(notificationToRow)];

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ranges: ['Registrations!A:U', 'Approval History!A:H', 'Notification Logs!A:H'],
      }),
    }
  );

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
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

  const now = new Date().toISOString();
  db.notificationConfig.lastSheetsSyncAt = now;
  for (const reg of db.registrations) {
    reg.sheetsSynced = true;
    reg.sheetsSyncError = undefined;
  }
  await persistDb(db);

  return {
    spreadsheetId,
    spreadsheetUrl,
    syncedRegistrations: db.registrations.length,
    syncedHistory: db.approvalHistory.length,
    syncedLogs: db.notificationLogs.length,
  };
}
