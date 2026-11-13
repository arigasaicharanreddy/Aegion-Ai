import fs from 'node:fs/promises';
import path from 'node:path';
import type { AccountStatus, UserRole } from '../../src/types/auth';
import type {
  ApprovalHistoryRecord,
  CustomerRegistration,
  NotificationChannelConfig,
  NotificationLogRecord,
} from '../../src/types/registration';
import type { AuditLogEntry, SupportTicket } from '../../src/types/project';

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  passwordHash?: string;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  mfaCodeHint?: string;
  authProvider: 'password' | 'google';
  workspaceId: string;
  workspaceName: string;
  avatarUrl?: string;
  registrationId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  email: string;
  role: UserRole;
  isDevPreview?: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface OneTimeTokenRecord {
  tokenHash: string;
  userId: string;
  email: string;
  registrationId?: string;
  purpose: 'activation' | 'password_reset';
  expiresAt: string;
  usedAt?: string;
}

export interface AiStatsRecord {
  applicationsGenerated: number;
  failedGenerations: number;
  tokensConsumed: number;
  activeProjects: number;
}

export interface AegionDatabaseState {
  users: StoredUserRecord[];
  sessions: SessionRecord[];
  oneTimeTokens: OneTimeTokenRecord[];
  registrations: CustomerRegistration[];
  approvalHistory: ApprovalHistoryRecord[];
  notificationLogs: NotificationLogRecord[];
  notificationConfig: NotificationChannelConfig;
  whatsappSecrets: {
    accessToken: string;
    webhookVerifyToken: string;
    appSecret: string;
  };
  emailSecrets: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    resendApiKey: string;
    sendgridApiKey: string;
  };
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicket[];
  aiStats: AiStatsRecord;
}

const DATA_DIR = path.resolve(process.cwd(), '.aegion-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function createInitialDbState(): AegionDatabaseState {
  return {
    users: [
      {
        id: 'usr-meera-approved',
        name: 'Meera Nair',
        email: 'meera.nair@vanguard.io',
        role: 'builder',
        status: 'active',
        mustChangePassword: false,
        mfaEnabled: false,
        authProvider: 'google',
        workspaceId: 'ws-vanguard',
        workspaceName: 'Vanguard People Ops',
        createdAt: '2026-11-08T09:15:00.000Z',
        updatedAt: '2026-11-09T11:30:00.000Z',
        lastLoginAt: '2026-11-11T14:20:00.000Z',
        registrationId: 'REG-2026-1001',
      },
    ],
    sessions: [],
    oneTimeTokens: [],
    registrations: [
      {
        id: 'REG-2026-1001',
        submissionDate: '2026-11-08T09:15:00.000Z',
        authProvider: 'google',
        fullName: 'Meera Nair',
        email: 'meera.nair@vanguard.io',
        phone: '+91 98450 22190',
        country: 'India',
        companyName: 'Vanguard People Systems',
        companyWebsite: 'https://vanguard.io',
        jobTitle: 'VP of Engineering',
        applicationTypes: ['HRMS', 'SaaS Applications'],
        projectName: 'Vanguard People HRMS',
        projectDescription: 'Multi-branch employee attendance, payroll ledger, and leave workflow suite.',
        businessIndustry: 'Enterprise Software',
        expectedUsers: '500 - 2,500',
        requiredModules: ['Employee Directory', 'Payroll Engine', 'Leave & Attendance', 'RBAC'],
        preferredBackendLanguage: 'Java',
        preferredFrontendFramework: 'React + TypeScript',
        preferredDatabase: 'PostgreSQL',
        expectedComplexity: 'Enterprise Multi-Tenant',
        preferredDeployment: 'Google Cloud Run',
        themeOption: 'Yes, use Aegion Glassmorphism themes',
        themeModePreference: 'dark',
        selectedThemeId: 'hrms-aurora-hr',
        customAccentColor: '#818CF8',
        typographyPreference: 'Manrope + Plus Jakarta Sans',
        projectDeadline: '2026-12-20',
        additionalFeatures: 'SSO integration with corporate Google Workspace.',
        integrationRequirements: 'Slack webhooks & PostgreSQL read replicas.',
        additionalComments: 'Need Java Spring Boot 3.4 scaffold export.',
        acceptedTerms: true,
        acceptedPrivacy: true,
        consentRegistrationNotifications: true,
        consentMarketing: false,
        status: 'Approved',
        approvalDate: '2026-11-08T12:40:00.000Z',
        approvedBy: 'arigasaicharan@gmail.com',
        adminComments: 'Approved for Enterprise HRMS workspace onboarding.',
        sheetsSynced: false,
      },
      {
        id: 'REG-2026-1002',
        submissionDate: '2026-11-11T16:05:00.000Z',
        authProvider: 'email',
        fullName: 'Rohan Kulkarni',
        email: 'rohan@medipulse.health',
        phone: '+1 415 890 3412',
        country: 'United States',
        companyName: 'MediPulse Pharmacy Network',
        companyWebsite: 'https://medipulse.health',
        jobTitle: 'Product Director',
        applicationTypes: ['Healthcare Store Management', 'Multi-Store Management'],
        projectName: 'MediPulse Rx Hub',
        projectDescription: 'Clinical inventory batch tracking, expiry alerts, and branch POS ledger.',
        businessIndustry: 'Healthcare & Pharmacy',
        expectedUsers: '150 - 500',
        requiredModules: ['Batch & Expiry', 'Prescription Compliance', 'Store Transfers', 'POS Billing'],
        preferredBackendLanguage: 'Python',
        preferredFrontendFramework: 'React + TypeScript',
        preferredDatabase: 'PostgreSQL',
        expectedComplexity: 'Enterprise Multi-Tenant',
        preferredDeployment: 'AWS ECS / Docker',
        themeOption: 'Yes, use Aegion Glassmorphism themes',
        themeModePreference: 'light',
        selectedThemeId: 'hc-aqua-clinical',
        customAccentColor: '#0EA5E9',
        typographyPreference: 'Manrope + Plus Jakarta Sans',
        projectDeadline: '2027-01-15',
        additionalFeatures: 'HIPAA audit export and barcode scanner hooks.',
        integrationRequirements: 'HL7 FHIR gateway + Stripe billing.',
        additionalComments: 'Awaiting architecture review.',
        acceptedTerms: true,
        acceptedPrivacy: true,
        consentRegistrationNotifications: true,
        consentMarketing: true,
        status: 'Pending Approval',
        sheetsSynced: false,
      },
      {
        id: 'REG-2026-1003',
        submissionDate: '2026-11-12T07:30:00.000Z',
        authProvider: 'email',
        fullName: 'Elena Vance',
        email: 'elena@nordicretail.eu',
        phone: '+46 70 441 8892',
        country: 'Sweden',
        companyName: 'Nordic Retail Collective',
        companyWebsite: 'https://nordicretail.eu',
        jobTitle: 'CTO',
        applicationTypes: ['E-Commerce', 'Multi-Store Management'],
        projectName: 'Nordic Omnichannel Storefront',
        projectDescription: 'Headless storefront with warehouse inventory sync across 18 European boutiques.',
        businessIndustry: 'Retail & E-Commerce',
        expectedUsers: '5,000+',
        requiredModules: ['Catalog & Variants', 'Checkout & Tax', 'Warehouse Routing', 'Analytics'],
        preferredBackendLanguage: 'Go',
        preferredFrontendFramework: 'Next.js + TypeScript',
        preferredDatabase: 'PostgreSQL',
        expectedComplexity: 'Moderate',
        preferredDeployment: 'Kubernetes',
        themeOption: 'I want to customize my theme',
        themeModePreference: 'dark',
        selectedThemeId: 'ec-velvet-noir',
        customAccentColor: '#F59E0B',
        typographyPreference: 'Manrope + JetBrains Mono',
        projectDeadline: '2027-02-01',
        additionalFeatures: 'Multi-currency VAT calculation.',
        integrationRequirements: 'Adyen payments + ERP webhook stream.',
        additionalComments: 'Prefer Go Gin backend output.',
        acceptedTerms: true,
        acceptedPrivacy: true,
        consentRegistrationNotifications: true,
        consentMarketing: false,
        status: 'Pending Approval',
        sheetsSynced: false,
      },
    ],
    approvalHistory: [
      {
        id: 'APR-9001',
        registrationId: 'REG-2026-1001',
        email: 'meera.nair@vanguard.io',
        previousStatus: 'Submitted',
        newStatus: 'Pending Approval',
        action: 'SUBMIT',
        adminId: 'system',
        timestamp: '2026-11-08T09:15:00.000Z',
        comments: 'Customer registration submitted via Google Sign-Up.',
      },
      {
        id: 'APR-9002',
        registrationId: 'REG-2026-1001',
        email: 'meera.nair@vanguard.io',
        previousStatus: 'Pending Approval',
        newStatus: 'Approved',
        action: 'APPROVE',
        adminId: 'arigasaicharan@gmail.com',
        timestamp: '2026-11-08T12:40:00.000Z',
        comments: 'Approved for Enterprise HRMS workspace onboarding.',
      },
      {
        id: 'APR-9003',
        registrationId: 'REG-2026-1002',
        email: 'rohan@medipulse.health',
        previousStatus: 'Submitted',
        newStatus: 'Pending Approval',
        action: 'SUBMIT',
        adminId: 'system',
        timestamp: '2026-11-11T16:05:00.000Z',
        comments: 'Multi-step registration submitted.',
      },
      {
        id: 'APR-9004',
        registrationId: 'REG-2026-1003',
        email: 'elena@nordicretail.eu',
        previousStatus: 'Submitted',
        newStatus: 'Pending Approval',
        action: 'SUBMIT',
        adminId: 'system',
        timestamp: '2026-11-12T07:30:00.000Z',
        comments: 'Multi-step registration submitted.',
      },
    ],
    notificationLogs: [
      {
        id: 'NTF-5001',
        registrationId: 'REG-2026-1001',
        channel: 'Email',
        recipient: 'meera.nair@vanguard.io',
        template: 'Registration Approved',
        status: 'Sent',
        sentTimestamp: '2026-11-08T12:40:05.000Z',
      },
      {
        id: 'NTF-5002',
        registrationId: 'REG-2026-1002',
        channel: 'System',
        recipient: 'arigasaicharan@gmail.com',
        template: 'New Registration Alert',
        status: 'Sent',
        sentTimestamp: '2026-11-11T16:05:02.000Z',
      },
    ],
    notificationConfig: {
      emailProvider: 'Gmail API',
      senderEmail: process.env.AEGION_SENDER_EMAIL || 'arigasaicharan@gmail.com',
      senderName: 'Aegion AI Onboarding',
      emailEnabled: true,
      whatsappEnabled: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      whatsappBusinessAccountId: process.env.WHATSAPP_WABA_ID || '',
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      whatsappAccessTokenConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      whatsappWebhookVerifyTokenConfigured: Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
      notifyAdminOnNewRegistration: true,
      notifyUserOnReceived: true,
      notifyUserOnApproval: true,
      sheetsSpreadsheetId: process.env.AEGION_SHEETS_SPREADSHEET_ID || '',
      sheetsSpreadsheetUrl: process.env.AEGION_SHEETS_SPREADSHEET_ID
        ? `https://docs.google.com/spreadsheets/d/${process.env.AEGION_SHEETS_SPREADSHEET_ID}/edit`
        : '',
    },
    whatsappSecrets: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      appSecret: process.env.WHATSAPP_APP_SECRET || '',
    },
    emailSecrets: {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: Number(process.env.SMTP_PORT || 587),
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      resendApiKey: process.env.RESEND_API_KEY || '',
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    },
    auditLogs: [
      {
        id: 'AUD-1041',
        timestamp: '2026-11-08T12:40:00.000Z',
        actorEmail: 'arigasaicharan@gmail.com',
        actorRole: 'super_admin',
        action: 'APPROVE_REGISTRATION',
        target: 'REG-2026-1001 (meera.nair@vanguard.io)',
        outcome: 'Allowed',
      },
      {
        id: 'AUD-1042',
        timestamp: '2026-11-11T16:05:00.000Z',
        actorEmail: 'rohan@medipulse.health',
        actorRole: 'guest',
        action: 'SUBMIT_REGISTRATION',
        target: 'REG-2026-1002 (MediPulse Rx Hub)',
        outcome: 'Allowed',
      },
    ],
    supportTickets: [
      {
        id: 'TKT-2041',
        subject: 'Custom Spring Boot OAuth2 resource server rule in Prompt Registry',
        category: 'Code Generation',
        priority: 'High',
        status: 'In Review',
        message: 'Need Keycloak tenant claim extraction added to the Java Backend Adapter pack.',
        userEmail: 'meera.nair@vanguard.io',
        createdAt: '2026-11-10T11:30:00.000Z',
      },
      {
        id: 'TKT-2044',
        subject: 'Multi-store inventory reconciliation webhook retry interval',
        category: 'Architecture',
        priority: 'Standard',
        status: 'Open',
        message: 'Looking for exponential backoff defaults in generated Celery tasks.',
        userEmail: 'arigasaicharan@gmail.com',
        createdAt: '2026-11-11T08:15:00.000Z',
      },
    ],
    aiStats: {
      applicationsGenerated: 14,
      failedGenerations: 1,
      tokensConsumed: 184200,
      activeProjects: 6,
    },
  };
}

let cachedDb: AegionDatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function loadDb(): Promise<AegionDatabaseState> {
  if (cachedDb) return cachedDb;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AegionDatabaseState>;
    const defaults = createInitialDbState();
    cachedDb = {
      ...defaults,
      ...parsed,
      notificationConfig: {
        ...defaults.notificationConfig,
        ...(parsed.notificationConfig || {}),
      },
      whatsappSecrets: {
        ...defaults.whatsappSecrets,
        ...(parsed.whatsappSecrets || {}),
      },
      emailSecrets: {
        ...defaults.emailSecrets,
        ...(parsed.emailSecrets || {}),
      },
      aiStats: {
        ...defaults.aiStats,
        ...(parsed.aiStats || {}),
      },
    };
  } catch {
    cachedDb = createInitialDbState();
    await persistDb(cachedDb);
  }
  return cachedDb;
}

export async function persistDb(state: AegionDatabaseState): Promise<void> {
  cachedDb = state;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  });
  await writeQueue;
}

export function appendAuditLog(
  db: AegionDatabaseState,
  actorEmail: string,
  actorRole: string,
  action: string,
  target: string,
  outcome: 'Allowed' | 'Denied'
) {
  db.auditLogs.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    actorEmail,
    actorRole,
    action,
    target,
    outcome,
  });
  if (db.auditLogs.length > 250) {
    db.auditLogs = db.auditLogs.slice(0, 250);
  }
}
