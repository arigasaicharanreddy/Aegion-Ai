import type { UserAccount } from '../types/auth';
import type {
  ApprovalHistoryRecord,
  CustomerRegistration,
  NotificationChannelConfig,
  NotificationLogRecord,
} from '../types/registration';
import type { AuditLogEntry, SupportTicket } from '../types/project';
import type { AdminOverviewPayload, BackendHealthStatus } from '../services/apiClient';
import type { StreamChatParams } from '../services/chatService';
import type { AgentNodeId } from '../types/chat';

export interface RuntimeModeStatus {
  freeDevMode: boolean;
  nodeEnv: string;
  pythonBackendConfigured: boolean;
  geminiConfigured: boolean;
  emailConfigured: boolean;
  whatsappConfigured: boolean;
  superAdminSecretProvided: boolean;
}

interface MockDevStore {
  registrations: CustomerRegistration[];
  approvalHistory: ApprovalHistoryRecord[];
  notificationLogs: NotificationLogRecord[];
  users: UserAccount[];
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicket[];
  notificationConfig: NotificationChannelConfig;
}

const STORAGE_KEY = 'aegion_free_dev_mock_store_v1';

function createDefaultMockStore(): MockDevStore {
  return {
    users: [
      {
        id: 'usr-super-admin-charan',
        name: 'Charan Ariga',
        email: 'arigasaicharan@gmail.com',
        role: 'super_admin',
        status: 'active',
        mustChangePassword: false,
        mfaEnabled: false,
        authProvider: 'password',
        workspaceId: 'ws-aegion-core',
        workspaceName: 'Aegion Core Studio',
      },
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
      },
    ],
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
        additionalComments: 'Approved mock dataset record.',
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
        additionalComments: 'Pending Super Admin review.',
        acceptedTerms: true,
        acceptedPrivacy: true,
        consentRegistrationNotifications: true,
        consentMarketing: true,
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
        newStatus: 'Approved',
        action: 'APPROVE',
        adminId: 'arigasaicharan@gmail.com',
        timestamp: '2026-11-08T12:40:00.000Z',
        comments: 'Approved in mock dev dataset.',
      },
    ],
    notificationLogs: [
      {
        id: 'NTF-DEV-1',
        registrationId: 'REG-2026-1002',
        channel: 'Email',
        recipient: 'rohan@medipulse.health',
        template: 'Registration Received',
        status: 'Skipped (Unconfigured)',
        sentTimestamp: '2026-11-11T16:05:02.000Z',
        failureReason: 'Email notifications optional in free development mode.',
      },
    ],
    auditLogs: [
      {
        id: 'AUD-DEV-1',
        timestamp: new Date().toISOString(),
        actorEmail: 'arigasaicharan@gmail.com',
        actorRole: 'super_admin',
        action: 'FREE_DEV_MODE_READY',
        target: 'Mock API & Local Preview Fallback',
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
    ],
    notificationConfig: {
      emailProvider: 'Gmail API',
      senderEmail: 'arigasaicharan@gmail.com',
      senderName: 'Aegion AI Onboarding',
      emailEnabled: true,
      whatsappEnabled: false,
      whatsappBusinessAccountId: '',
      whatsappPhoneNumberId: '',
      whatsappAccessTokenConfigured: false,
      whatsappWebhookVerifyTokenConfigured: false,
      notifyAdminOnNewRegistration: true,
      notifyUserOnReceived: true,
      notifyUserOnApproval: true,
      sheetsSpreadsheetId: '',
      sheetsSpreadsheetUrl: '',
    },
  };
}

function readStore(): MockDevStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDevStore;
  } catch {
    // ignore storage failures
  }
  const initial = createDefaultMockStore();
  writeStore(initial);
  return initial;
}

function writeStore(store: MockDevStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

export const mockDevApi = {
  getHealth(): BackendHealthStatus {
    return {
      status: 'ok (mock-dev-fallback)',
      frontendRuntime: 'react-vite',
      gatewayRuntime: 'frontend-mock-adapter',
      pythonBackendConfigured: false,
      pythonBackendUrl: null,
      aiModel: 'free-dev-mock-orchestrator',
      timestamp: new Date().toISOString(),
    };
  },

  getRuntimeMode(): RuntimeModeStatus {
    return {
      freeDevMode: true,
      nodeEnv: 'development',
      pythonBackendConfigured: false,
      geminiConfigured: false,
      emailConfigured: false,
      whatsappConfigured: false,
      superAdminSecretProvided: false,
    };
  },

  devPreviewSession(role: 'builder' | 'super_admin'): { sessionToken: string; user: UserAccount } {
    const store = readStore();
    const user =
      role === 'super_admin'
        ? store.users.find((u) => u.role === 'super_admin')!
        : store.users.find((u) => u.role === 'builder')!;
    return {
      sessionToken: `mock-dev-${role}-token`,
      user,
    };
  },

  submitRegistration(payload: Record<string, unknown>) {
    const store = readStore();
    const now = new Date().toISOString();
    const id = `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;
    const reg: CustomerRegistration = {
      id,
      submissionDate: now,
      authProvider: payload.authProvider === 'google' ? 'google' : 'email',
      fullName: String(payload.fullName || 'Dev Applicant'),
      email: String(payload.email || 'dev@example.com').toLowerCase(),
      phone: String(payload.phone || ''),
      country: String(payload.country || 'India'),
      companyName: String(payload.companyName || 'Demo Studio'),
      companyWebsite: String(payload.companyWebsite || ''),
      jobTitle: String(payload.jobTitle || 'Founder'),
      applicationTypes: (payload.applicationTypes as CustomerRegistration['applicationTypes']) || ['SaaS Applications'],
      projectName: String(payload.projectName || 'Demo Project'),
      projectDescription: String(payload.projectDescription || ''),
      businessIndustry: String(payload.businessIndustry || 'Enterprise Software'),
      expectedUsers: String(payload.expectedUsers || '100 - 500'),
      requiredModules: (payload.requiredModules as string[]) || [],
      preferredBackendLanguage: (payload.preferredBackendLanguage as CustomerRegistration['preferredBackendLanguage']) || 'Python',
      preferredFrontendFramework: String(payload.preferredFrontendFramework || 'React + TypeScript'),
      preferredDatabase: String(payload.preferredDatabase || 'PostgreSQL'),
      expectedComplexity: (payload.expectedComplexity as CustomerRegistration['expectedComplexity']) || 'Moderate',
      preferredDeployment: String(payload.preferredDeployment || 'Docker'),
      themeOption: (payload.themeOption as CustomerRegistration['themeOption']) || 'Yes, use Aegion Glassmorphism themes',
      themeModePreference: (payload.themeModePreference as 'light' | 'dark') || 'dark',
      selectedThemeId: String(payload.selectedThemeId || 'hrms-aurora-hr'),
      customAccentColor: String(payload.customAccentColor || '#7C3AED'),
      typographyPreference: String(payload.typographyPreference || 'Manrope + Plus Jakarta Sans'),
      projectDeadline: String(payload.projectDeadline || ''),
      additionalFeatures: String(payload.additionalFeatures || ''),
      integrationRequirements: String(payload.integrationRequirements || ''),
      additionalComments: String(payload.additionalComments || ''),
      acceptedTerms: true,
      acceptedPrivacy: true,
      consentRegistrationNotifications: true,
      consentMarketing: Boolean(payload.consentMarketing),
      status: 'Pending Approval',
    };
    store.registrations.unshift(reg);
    store.notificationLogs.unshift({
      id: `NTF-DEV-${Date.now()}`,
      registrationId: id,
      channel: 'Email',
      recipient: reg.email,
      template: 'Registration Received',
      status: 'Skipped (Unconfigured)',
      sentTimestamp: now,
      failureReason: 'Email notifications optional in free development mode.',
    });
    writeStore(store);
    return {
      registrationId: id,
      status: reg.status,
      submissionDate: now,
      projectName: reg.projectName,
      email: reg.email,
    };
  },

  checkRegistrationStatus(query: { email?: string; id?: string }) {
    const store = readStore();
    const reg = store.registrations.find(
      (r) =>
        (query.email && r.email.toLowerCase() === query.email.toLowerCase()) ||
        (query.id && r.id.toUpperCase() === query.id.toUpperCase())
    );
    if (!reg) {
      throw new Error('No matching registration request found in local dev store.');
    }
    return {
      registrationId: reg.id,
      projectName: reg.projectName,
      fullName: reg.fullName,
      status: reg.status,
      submissionDate: reg.submissionDate,
      approvalDate: reg.approvalDate,
      adminComments: reg.adminComments,
    };
  },

  getAdminOverview(): AdminOverviewPayload {
    const store = readStore();
    return {
      kpis: {
        totalRegistrations: store.registrations.length,
        pendingApprovals: store.registrations.filter((r) => r.status === 'Pending Approval').length,
        approvedUsers: store.users.filter((u) => u.status === 'active').length,
        activeProjects: 6,
        applicationsGenerated: 14,
        failedGenerations: 0,
        tokensConsumed: 184200,
        notificationDeliveryRate: 100,
        recentActivitiesCount: store.auditLogs.length,
      },
      registrations: store.registrations,
      approvalHistory: store.approvalHistory,
      notificationLogs: store.notificationLogs,
      users: store.users,
      auditLogs: store.auditLogs,
      supportTickets: store.supportTickets,
      notificationConfig: store.notificationConfig,
    };
  },

  decideRegistration(
    registrationId: string,
    decision: 'approve' | 'reject' | 'request_info' | 'suspend' | 'reactivate',
    comments: string
  ) {
    const store = readStore();
    const reg = store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');
    const prev = reg.status;
    reg.status =
      decision === 'approve' || decision === 'reactivate'
        ? 'Approved'
        : decision === 'reject'
        ? 'Rejected'
        : decision === 'request_info'
        ? 'Info Requested'
        : 'Suspended';
    reg.adminComments = comments || reg.adminComments;
    store.approvalHistory.unshift({
      id: `APR-${Math.floor(1000 + Math.random() * 9000)}`,
      registrationId: reg.id,
      email: reg.email,
      previousStatus: prev,
      newStatus: reg.status,
      action: decision.toUpperCase() as ApprovalHistoryRecord['action'],
      adminId: 'arigasaicharan@gmail.com',
      timestamp: new Date().toISOString(),
      comments: comments || `Mock dev decision: ${decision}`,
    });
    writeStore(store);
    return {
      ok: true,
      registration: reg,
      activationLinkPreview:
        decision === 'approve' ? `${window.location.origin}/?activate=mock-dev-activation-${reg.id}` : undefined,
    };
  },

  async streamMockAgentChat(params: StreamChatParams): Promise<void> {
    const steps: Array<{ id: AgentNodeId; label: string; detail: string }> = [
      { id: 'intent', label: 'Intent Agent', detail: `Resolving target language (${params.language}) & domain (${params.category})` },
      { id: 'requirement', label: 'Requirement Analysis Agent', detail: 'Extracting modules, roles & business rules (Mock Dev)' },
      { id: 'architect', label: 'Architect Agent', detail: 'Composing layered prompt packs' },
      { id: 'uiux', label: 'UI/UX Agent', detail: `Applying Glass UI tokens (${params.themeName})` },
      { id: 'database', label: 'Database Agent', detail: 'Generating PostgreSQL DDL migration' },
      { id: 'backend', label: 'Backend Agent', detail: `Generating ${params.language} / ${params.framework} API scaffold` },
      { id: 'frontend', label: 'Frontend Agent', detail: 'Generating tokenized React components' },
      { id: 'security', label: 'Security Agent', detail: 'Applying RBAC & tenant guards' },
      { id: 'testing', label: 'Testing Agent', detail: 'Generating contract tests' },
    ];

    for (const s of steps) {
      params.onAgentStep({ id: s.id, label: s.label, status: 'completed', detail: s.detail });
    }

    const reply = `Generated ${params.category} application architecture in ${params.language} (${params.framework}) using Free Development Mode mock API data. UI tokens remain decoupled under ${params.themeName}.`;
    params.onToken(reply);
    params.onProposal({
      id: `prop-mock-${Date.now()}`,
      summary: `${params.category} update (${params.language} / ${params.framework})`,
      detectedCategory: params.category as never,
      detectedLanguage: params.language as never,
      detectedFramework: params.framework,
      detectedFrontend: 'React + TypeScript',
      database: 'PostgreSQL',
      authMethod: 'JWT + RBAC',
      recommendedThemeId: params.themeId,
      modules: ['RBAC Auth', 'Core API Service', 'Audit Ledger', 'Glass UI Tokens'],
      userRoles: ['super_admin', 'builder'],
      businessRules: ['Server-side RBAC enforcement', 'Decoupled CSS design tokens'],
      databaseSchema: [
        {
          name: 'app_entities',
          columns: [
            { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
            { name: 'name', type: 'VARCHAR(160)', constraints: 'NOT NULL' },
          ],
        },
      ],
      apiDefinitions: [
        { method: 'GET', path: '/api/v1/items', summary: 'Fetch workspace items', authRequired: true },
      ],
      files: [
        {
          path: `src/app.${params.language === 'Python' ? 'py' : 'ts'}`,
          language: params.language,
          summary: `Mock dev ${params.framework} entrypoint`,
          content: `// Free Dev Mode mock generated service\n// Prompt: ${params.message}\nexport const status = "ok";\n`,
        },
      ],
      securityChecklist: ['RBAC verified', 'No hardcoded secrets'],
      status: 'pending',
    });
    params.onDone({ model: 'free-dev-mock-orchestrator' });
  },
};
