import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AccountStatus,
  PlatformThemeGovernanceConfig,
  PlatformThemePreference,
  UserPreferences,
  UserRole,
} from '../../src/types/auth';
import type {
  ApprovalHistoryRecord,
  ContactCategory,
  ContactInquiry,
  CustomerRegistration,
  NotificationChannelConfig,
  NotificationLogRecord,
} from '../../src/types/registration';
import type { AuditLogEntry, SupportTicket } from '../../src/types/project';
import {
  isValidPlatformThemeId,
  PLATFORM_THEME_CATEGORIES,
  resolveLegacyPlatformThemeId,
} from '../../src/platform-themes/catalog';

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  pendingEmail?: string;
  role: UserRole;
  status: AccountStatus;
  passwordHash?: string;
  mustChangePassword: boolean;
  customPasswordSet?: boolean;
  mfaEnabled: boolean;
  mfaCodeHint?: string;
  authProvider: 'password' | 'google';
  workspaceId: string;
  workspaceName: string;
  avatarUrl?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  country?: string;
  preferences?: UserPreferences;
  platformTheme?: PlatformThemePreference;
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
  newEmail?: string;
  registrationId?: string;
  purpose: 'activation' | 'password_reset' | 'admin_reset' | 'email_change';
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
  contactInquiries: ContactInquiry[];
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
  platformThemeConfig: PlatformThemeGovernanceConfig;
}

const DATA_DIR = path.resolve(process.cwd(), '.aegion-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const VALID_CATEGORIES = new Set<ContactCategory>([
  'General Inquiry',
  'Business Partnership',
  'Product Information',
  'Technical Support',
  'Workspace Access',
  'Other',
]);

function normalizeContactCategory(raw: unknown): ContactCategory {
  if (typeof raw === 'string' && VALID_CATEGORIES.has(raw as ContactCategory)) {
    return raw as ContactCategory;
  }
  const lower = String(raw || '').toLowerCase();
  if (lower.includes('partner')) return 'Business Partnership';
  if (lower.includes('support') || lower.includes('technical')) return 'Technical Support';
  if (lower.includes('access') || lower.includes('workspace') || lower.includes('demo')) return 'Workspace Access';
  if (lower.includes('product') || lower.includes('store') || lower.includes('health') || lower.includes('hrms')) {
    return 'Product Information';
  }
  return 'General Inquiry';
}

function normalizeContactInquiry(raw: Record<string, unknown>): ContactInquiry {
  const legacyTopic = typeof raw.topic === 'string' ? raw.topic : '';
  const subject =
    typeof raw.subject === 'string' && raw.subject.trim()
      ? raw.subject.trim()
      : legacyTopic || 'Aegion AI Inquiry';
  const category = normalizeContactCategory(raw.category || legacyTopic);
  const status =
    raw.status === 'In Review' || raw.status === 'Resolved' ? raw.status : 'New';
  return {
    id: String(raw.id || `INQ-${Date.now()}`),
    submittedAt: String(raw.submittedAt || new Date().toISOString()),
    fullName: String(raw.fullName || ''),
    email: String(raw.email || ''),
    company: String(raw.company || ''),
    phone: typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone.trim() : undefined,
    subject,
    category,
    message: String(raw.message || ''),
    status,
    adminNotes: typeof raw.adminNotes === 'string' ? raw.adminNotes : '',
    responseDate: typeof raw.responseDate === 'string' ? raw.responseDate : undefined,
    emailNotificationStatus:
      raw.emailNotificationStatus === 'Sent' ||
      raw.emailNotificationStatus === 'Queued' ||
      raw.emailNotificationStatus === 'Failed'
        ? raw.emailNotificationStatus
        : 'Skipped (Unconfigured)',
    sheetsSynced: Boolean(raw.sheetsSynced),
  };
}

function createInitialDbState(): AegionDatabaseState {
  const defaultAdminEmail = (process.env.AEGION_SUPER_ADMIN_EMAIL || 'aegionlabs.in@gmail.com').trim();
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
        phone: '+91 98450 22190',
        companyName: 'Vanguard People Systems',
        jobTitle: 'VP of Engineering',
        country: 'India',
        preferences: {
          themePreference: 'dark',
          compactMode: false,
          emailNotificationsEnabled: true,
        },
        platformTheme: {
          themeId: 'obsidian-glass',
          animationMode: 'balanced',
          enable3D: false,
          updatedAt: '2026-11-09T11:30:00.000Z',
        },
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
        accountStatus: 'Active',
        approvalDate: '2026-11-08T12:40:00.000Z',
        approvedBy: defaultAdminEmail,
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
        accountStatus: 'Pending Approval',
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
        accountStatus: 'Pending Approval',
        sheetsSynced: false,
      },
    ],
    contactInquiries: [
      {
        id: 'INQ-2026-3001',
        submittedAt: '2026-11-12T10:15:00.000Z',
        fullName: 'Ananya Deshmukh',
        email: 'ananya@zenithretail.in',
        company: 'Zenith Retail Group',
        phone: '+91 98201 44510',
        subject: 'Multi-Store Operations & Storefront Consolidation',
        category: 'Product Information',
        message: 'Looking to unify 18 retail stores, vendor billing, and customer portal under one branded workspace.',
        status: 'In Review',
        adminNotes: 'Prepared multi-store workflow blueprint overview for follow-up.',
        emailNotificationStatus: 'Sent',
        sheetsSynced: false,
      },
      {
        id: 'INQ-2026-3002',
        submittedAt: '2026-11-13T14:40:00.000Z',
        fullName: 'Daniel Brooks',
        email: 'dbrooks@harborclinic.org',
        company: 'Harbor Health Network',
        phone: '+1 415 620 8831',
        subject: 'Healthcare & Clinic Portal Onboarding Walkthrough',
        category: 'Workspace Access',
        message: 'Interested in an enterprise demo for patient intake, pharmacy stock alerts, and role-based clinic approvals.',
        status: 'New',
        adminNotes: '',
        emailNotificationStatus: 'Skipped (Unconfigured)',
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
        adminId: defaultAdminEmail,
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
        recipient: defaultAdminEmail,
        template: 'New Registration Alert',
        status: 'Sent',
        sentTimestamp: '2026-11-11T16:05:02.000Z',
      },
    ],
    notificationConfig: {
      emailProvider: 'Gmail API',
      senderEmail: process.env.AEGION_SENDER_EMAIL || defaultAdminEmail,
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
      contactSpreadsheetId: process.env.AEGION_CONTACT_SHEETS_SPREADSHEET_ID || '',
      contactSpreadsheetUrl: process.env.AEGION_CONTACT_SHEETS_SPREADSHEET_ID
        ? `https://docs.google.com/spreadsheets/d/${process.env.AEGION_CONTACT_SHEETS_SPREADSHEET_ID}/edit`
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
        actorEmail: defaultAdminEmail,
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
        subject: 'Custom workflow approval template',
        category: 'Code Generation',
        priority: 'High',
        status: 'In Review',
        message: 'Need multi-department sign-off rules added to our enterprise HR portal.',
        userEmail: 'meera.nair@vanguard.io',
        createdAt: '2026-11-10T11:30:00.000Z',
      },
      {
        id: 'TKT-2044',
        subject: 'Multi-store inventory reconciliation schedule',
        category: 'Architecture',
        priority: 'Standard',
        status: 'Open',
        message: 'Looking for nightly stock reconciliation threshold alerts across branches.',
        userEmail: defaultAdminEmail,
        createdAt: '2026-11-11T08:15:00.000Z',
      },
    ],
    aiStats: {
      applicationsGenerated: 14,
      failedGenerations: 1,
      tokensConsumed: 184200,
      activeProjects: 6,
    },
    platformThemeConfig: {
      defaultPublicThemeId: 'obsidian-glass',
      defaultUserThemeId: 'obsidian-glass',
      defaultAdminThemeId: 'graphite-executive',
      fallbackThemeId: 'obsidian-glass',
      disabledThemeIds: [],
      disabledCategories: [],
      animationsGloballyAllowed: true,
      threeDGloballyAllowed: false,
      updatedAt: '2026-11-12T00:00:00.000Z',
      updatedBy: defaultAdminEmail,
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
    const rawContacts = Array.isArray(parsed.contactInquiries)
      ? parsed.contactInquiries
      : defaults.contactInquiries;

    const rawUsers = Array.isArray(parsed.users) ? parsed.users : defaults.users;
    const rawThemeConfig = parsed.platformThemeConfig || defaults.platformThemeConfig;
    const validCatSet = new Set<string>(PLATFORM_THEME_CATEGORIES);

    cachedDb = {
      ...defaults,
      ...parsed,
      users: rawUsers.map((u) =>
        u.platformTheme
          ? {
              ...u,
              platformTheme: {
                ...u.platformTheme,
                themeId: resolveLegacyPlatformThemeId(u.platformTheme.themeId),
                enable3D: false,
              },
            }
          : u
      ),
      contactInquiries: rawContacts.map((item) =>
        normalizeContactInquiry(item as unknown as Record<string, unknown>)
      ),
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
      platformThemeConfig: {
        ...defaults.platformThemeConfig,
        ...rawThemeConfig,
        defaultPublicThemeId: resolveLegacyPlatformThemeId(rawThemeConfig.defaultPublicThemeId),
        defaultUserThemeId: resolveLegacyPlatformThemeId(rawThemeConfig.defaultUserThemeId),
        defaultAdminThemeId: resolveLegacyPlatformThemeId(
          rawThemeConfig.defaultAdminThemeId || 'graphite-executive'
        ),
        fallbackThemeId: resolveLegacyPlatformThemeId(rawThemeConfig.fallbackThemeId),
        threeDGloballyAllowed: false,
        disabledThemeIds: Array.isArray(rawThemeConfig.disabledThemeIds)
          ? Array.from(
              new Set(
                rawThemeConfig.disabledThemeIds.filter(
                  (id) => isValidPlatformThemeId(id) && id !== resolveLegacyPlatformThemeId(rawThemeConfig.fallbackThemeId)
                )
              )
            )
          : defaults.platformThemeConfig.disabledThemeIds,
        disabledCategories: Array.isArray(rawThemeConfig.disabledCategories)
          ? rawThemeConfig.disabledCategories.filter((c) => validCatSet.has(c))
          : defaults.platformThemeConfig.disabledCategories,
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

export function getActiveSuperAdminEmail(db: AegionDatabaseState): string {
  const admin = db.users.find((u) => u.role === 'super_admin');
  return admin?.email || process.env.AEGION_SUPER_ADMIN_EMAIL || 'aegionlabs.in@gmail.com';
}
