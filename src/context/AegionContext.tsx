import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UserAccount, Workspace } from '../types/auth';
import { ChangeProposal, ChatMessage } from '../types/chat';
import { AppCategory, AuditLogEntry, ProgrammingLanguage, Project, SupportTicket } from '../types/project';
import { PromptEntry } from '../types/prompt';
import { ThemeCustomization } from '../types/theme';
import { INITIAL_AUDIT_LOGS, INITIAL_PROJECTS, INITIAL_PROMPTS, INITIAL_TICKETS } from '../config/seedData';
import { APPLICATION_TEMPLATES, SUPPORTED_LANGUAGES } from '../config/appConfig';
import { getDefaultThemeForCategory, mapAppCategoryToThemeCategory } from '../themes';
import { loadThemeCustomizations, saveThemeCustomizations } from '../services/themeService';
import { bumpMinorVersion } from '../services/promptService';
import { apiClient, type RuntimeModeStatus } from '../services/apiClient';
import {
  clearGoogleAccessToken,
  getGoogleAccessToken,
  signInWithGooglePopup,
  signOutGoogle,
} from '../services/googleAuth';

export type AppRoute =
  | 'landing'
  | 'login'
  | 'register'
  | 'pending-approval'
  | 'activate'
  | 'reset-password'
  | 'admin-reset'
  | 'verify-email'
  | 'admin-login'
  | 'forgot-password'
  | 'dashboard'
  | 'projects'
  | 'builder'
  | 'templates'
  | 'prompts'
  | 'themes'
  | 'deployments'
  | 'usage'
  | 'settings'
  | 'support'
  | 'admin'
  | 'shared-preview';

export interface ToastNotice {
  id: string;
  title: string;
  tone: 'info' | 'success' | 'error';
}

export interface PendingStatusContext {
  registrationId?: string;
  projectName?: string;
  fullName?: string;
  email?: string;
  status?: string;
  submissionDate?: string;
  adminComments?: string;
}

export interface GooglePrefillProfile {
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface AegionContextValue {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  user: UserAccount | null;
  authInitialized: boolean;
  runtimeMode: RuntimeModeStatus;
  workspace: Workspace;
  setAuthenticatedUser: (user: UserAccount, destination?: AppRoute) => void;
  updateCurrentUser: (user: UserAccount) => void;
  logout: () => Promise<void>;
  updateWorkspace: (patch: Partial<Workspace>) => void;

  googleAccessToken: string | null;
  connectGoogleWorkspace: () => Promise<string | null>;

  pendingStatusInfo: PendingStatusContext | null;
  setPendingStatusInfo: (info: PendingStatusContext | null) => void;
  googlePrefill: GooglePrefillProfile | null;
  setGooglePrefill: (profile: GooglePrefillProfile | null) => void;
  adminPortalEmailPrefill: string | null;
  setAdminPortalEmailPrefill: (email: string | null) => void;
  activationToken: string | null;
  setActivationToken: (token: string | null) => void;
  resetToken: string | null;
  setResetToken: (token: string | null) => void;
  adminResetToken: string | null;
  setAdminResetToken: (token: string | null) => void;
  verifyEmailToken: string | null;
  setVerifyEmailToken: (token: string | null) => void;

  platformCompactMode: boolean;
  setPlatformCompactMode: (compact: boolean) => void;

  projects: Project[];
  activeProjectId: string;
  activeProject: Project;
  setActiveProjectId: (id: string) => void;
  createProject: (input: {
    name: string;
    description: string;
    category: AppCategory;
    language: ProgrammingLanguage;
    themeId?: string;
    initialPrompt?: string;
  }) => Project;
  cloneProject: (projectId: string) => Project | null;
  toggleShareProject: (projectId: string) => void;
  inviteCollaborator: (projectId: string, name: string, email: string, role: 'Editor' | 'Viewer') => void;
  updateProjectTheme: (projectId: string, themeId: string, customization?: ThemeCustomization) => void;
  updateProjectLanguage: (projectId: string, language: ProgrammingLanguage) => void;
  updateProjectCategory: (projectId: string, category: AppCategory) => void;
  applyProposalToProject: (projectId: string, messageId: string, proposal: ChangeProposal) => void;
  rejectProposal: (projectId: string, messageId: string) => void;
  rollbackProjectVersion: (projectId: string, versionId: string) => void;

  chatHistory: Record<string, ChatMessage[]>;
  setProjectMessages: (projectId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => void;

  prompts: PromptEntry[];
  savePromptDraft: (promptId: string, content: string, changeDescription: string) => void;
  approvePromptVersion: (promptId: string, note: string) => void;
  createPrompt: (entry: Omit<PromptEntry, 'id' | 'updatedAt' | 'approvalHistory'>) => void;

  themeCustomizations: Record<string, ThemeCustomization>;
  updateThemeCustomization: (presetId: string, customization: ThemeCustomization) => void;

  tickets: SupportTicket[];
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'userEmail'>) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;

  auditLogs: AuditLogEntry[];
  recordAudit: (action: string, target: string, outcome: 'Allowed' | 'Denied') => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  sharedProject: Project | null;
  toasts: ToastNotice[];
  notify: (title: string, tone?: ToastNotice['tone']) => void;
  dismissToast: (id: string) => void;
}

const AegionContext = createContext<AegionContextValue | null>(null);

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws-aegion-core',
  name: 'Aegion Core Studio',
  slug: 'aegion-core-studio',
  pythonBackendUrl: '',
  createdAt: '2026-10-25T10:00:00Z',
};

const INITIAL_CHAT: Record<string, ChatMessage[]> = {
  'proj-hrms-aurora': [
    {
      id: 'msg-init-1',
      role: 'user',
      content:
        'Build an HRMS application with employee management, attendance, payroll, and leave management. Use Java Spring Boot.',
      timestamp: '2026-11-10T14:15:00Z',
    },
    {
      id: 'msg-init-2',
      role: 'assistant',
      content:
        'Synthesized the Vanguard People HRMS specification using the Enterprise HRMS domain pack and Java 21 / Spring Boot 3.4 adapter. The Glass UI styling is bound via decoupled CSS design tokens (Aurora HR) so switching themes never modifies payroll or leave approval business logic.',
      timestamp: '2026-11-10T14:16:00Z',
      modelUsed: 'gemini-4-hydrogen',
    },
  ],
};

const ACTIVE_ROUTE_STORAGE_KEY = 'aegion_active_route_v1';

const PROTECTED_WORKSPACE_ROUTES = new Set<AppRoute>([
  'dashboard',
  'projects',
  'builder',
  'templates',
  'prompts',
  'themes',
  'deployments',
  'usage',
  'settings',
  'support',
  'admin',
]);

export const AegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('share')) return 'shared-preview';
      if (params.get('activate')) return 'activate';
      if (params.get('reset')) return 'reset-password';
      if (params.get('adminReset')) return 'admin-reset';
      if (params.get('verifyEmail')) return 'verify-email';
      if (params.get('portal') === 'admin') return 'admin-login';
      try {
        const hasToken = Boolean(window.sessionStorage.getItem('aegion_session_token_v1'));
        const saved = window.sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY) as AppRoute | null;
        if (hasToken && saved && PROTECTED_WORKSPACE_ROUTES.has(saved)) {
          return saved;
        }
      } catch {
        // ignore storage errors
      }
    }
    return 'landing';
  });

  const [activationToken, setActivationToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('activate');
    }
    return null;
  });

  const [resetToken, setResetToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('reset');
    }
    return null;
  });

  const [adminResetToken, setAdminResetToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('adminReset');
    }
    return null;
  });

  const [verifyEmailToken, setVerifyEmailToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('verifyEmail');
    }
    return null;
  });

  const [user, setUser] = useState<UserAccount | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeModeStatus>({
    nodeEnv: 'development',
    pythonBackendConfigured: false,
    geminiConfigured: false,
    emailConfigured: false,
    whatsappConfigured: false,
    superAdminConfigured: true,
  });
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => getGoogleAccessToken());
  const [pendingStatusInfo, setPendingStatusInfo] = useState<PendingStatusContext | null>(null);
  const [googlePrefill, setGooglePrefill] = useState<GooglePrefillProfile | null>(null);
  const [adminPortalEmailPrefill, setAdminPortalEmailPrefill] = useState<string | null>(null);
  const [platformCompactMode, setPlatformCompactMode] = useState(false);

  const [workspace, setWorkspace] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('aegion_projects_v1');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(() => projects[0]?.id || 'proj-hrms-aurora');
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(INITIAL_CHAT);
  const [prompts, setPrompts] = useState<PromptEntry[]>(INITIAL_PROMPTS);
  const [themeCustomizations, setThemeCustomizations] = useState<Record<string, ThemeCustomization>>(() =>
    loadThemeCustomizations()
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-4-hydrogen');
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.getCurrentSession(),
      apiClient.getRuntimeMode().catch(() => null),
    ]).then(([sessionRes, modeRes]) => {
      if (!active) return;
      if (modeRes) {
        setRuntimeMode(modeRes);
      }
      if (sessionRes.authenticated && sessionRes.user) {
        const restoredUser = sessionRes.user;
        setUser(restoredUser);
        if (restoredUser.workspaceName) {
          setWorkspace((prev) => ({
            ...prev,
            id: restoredUser.workspaceId || prev.id,
            name: restoredUser.workspaceName,
            slug: restoredUser.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          }));
        }

        const params =
          typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const hasActionToken = Boolean(
          params?.get('share') ||
            params?.get('activate') ||
            params?.get('reset') ||
            params?.get('adminReset') ||
            params?.get('verifyEmail')
        );

        if (!hasActionToken) {
          let savedRoute: AppRoute | null = null;
          try {
            const raw = sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY) as AppRoute | null;
            if (raw && PROTECTED_WORKSPACE_ROUTES.has(raw)) {
              savedRoute = raw;
            }
          } catch {
            savedRoute = null;
          }

          if (restoredUser.role === 'super_admin') {
            if (restoredUser.mustChangePassword) {
              setRoute('admin-login');
            } else {
              const target = savedRoute || 'admin';
              setRoute(target);
              if (params?.get('portal') === 'admin') {
                window.history.replaceState({}, '', window.location.pathname);
              }
            }
          } else if (restoredUser.status === 'active') {
            const target = savedRoute && savedRoute !== 'admin' ? savedRoute : 'dashboard';
            setRoute(target);
          }
        }
      } else {
        try {
          sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
        } catch {
          // ignore
        }
        setRoute((prev) => (PROTECTED_WORKSPACE_ROUTES.has(prev) ? 'login' : prev));
      }
      setAuthInitialized(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('aegion_projects_v1', JSON.stringify(projects));
    } catch {
      // ignore storage errors
    }
  }, [projects]);

  const notify = useCallback((title: string, tone: ToastNotice['tone'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback(
    (nextRoute: AppRoute) => {
      if (PROTECTED_WORKSPACE_ROUTES.has(nextRoute)) {
        if (!user) {
          notify('Please sign in or complete approved registration to enter the workspace.', 'info');
          setRoute('login');
          return;
        }
        if (user.status !== 'active') {
          notify('Your registration is awaiting Super Admin approval or activation.', 'info');
          setRoute('pending-approval');
          return;
        }
        if (nextRoute === 'admin') {
          if (user.role !== 'super_admin') {
            notify('Super Admin privileges required to access the Admin Console.', 'error');
            return;
          }
          if (user.mustChangePassword) {
            notify('Please set a strong permanent Super Admin password first.', 'info');
            setRoute('admin-login');
            return;
          }
        }
        try {
          sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, nextRoute);
        } catch {
          // ignore
        }
      } else {
        try {
          sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [user, notify]
  );

  const setAuthenticatedUser = useCallback((nextUser: UserAccount, destination?: AppRoute) => {
    setUser(nextUser);
    if (nextUser.workspaceName) {
      setWorkspace((prev) => ({
        ...prev,
        id: nextUser.workspaceId || prev.id,
        name: nextUser.workspaceName,
        slug: nextUser.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }));
    }
    const targetRoute: AppRoute =
      destination ||
      (nextUser.role === 'super_admin' && !nextUser.mustChangePassword
        ? 'admin'
        : nextUser.status === 'active'
        ? 'dashboard'
        : 'pending-approval');

    if (PROTECTED_WORKSPACE_ROUTES.has(targetRoute)) {
      try {
        sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, targetRoute);
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location.search.includes('portal=admin')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    setRoute(targetRoute);
  }, []);

  const updateCurrentUser = useCallback((nextUser: UserAccount) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    await signOutGoogle();
    clearGoogleAccessToken();
    try {
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    } catch {
      // ignore
    }
    setGoogleAccessToken(null);
    setUser(null);
    setRoute('landing');
    notify('Signed out securely');
  }, [notify]);

  const connectGoogleWorkspace = async (): Promise<string | null> => {
    const res = await signInWithGooglePopup();
    setGoogleAccessToken(res.accessToken);
    return res.accessToken;
  };

  const updateWorkspace = (patch: Partial<Workspace>) => {
    setWorkspace((prev) => ({ ...prev, ...patch }));
    notify('Workspace settings saved', 'success');
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const sharedProject = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const token = new URLSearchParams(window.location.search).get('share');
    if (!token) return null;
    return projects.find((p) => p.shareToken === token && p.shareEnabled) || projects[0] || null;
  }, [projects]);

  const recordAudit = (action: string, target: string, outcome: 'Allowed' | 'Denied') => {
    const entry: AuditLogEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorEmail: user?.email || 'anonymous',
      actorRole: user?.role || 'guest',
      action,
      target,
      outcome,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const createProject: AegionContextValue['createProject'] = ({
    name,
    description,
    category,
    language,
    themeId,
    initialPrompt,
  }) => {
    const langMeta = SUPPORTED_LANGUAGES.find((l) => l.language === language) || SUPPORTED_LANGUAGES[0];
    const tpl = APPLICATION_TEMPLATES.find((t) => t.category === category) || APPLICATION_TEMPLATES[0];
    const resolvedTheme = themeId || getDefaultThemeForCategory(category).id;
    const now = new Date().toISOString();
    const id = `proj-${Date.now()}`;

    const newProj: Project = {
      id,
      name: name.trim() || `${category} Workspace`,
      description: description.trim() || tpl.summary,
      category,
      themeCategory: mapAppCategoryToThemeCategory(category),
      language,
      framework: langMeta.framework,
      frontendFramework: 'React + TypeScript',
      database: 'PostgreSQL',
      authMethod: 'JWT + RBAC',
      version: 'v1.0.0',
      status: 'Draft',
      themeId: resolvedTheme,
      modules: [...tpl.coreModules],
      shareToken: `shr_${Math.random().toString(36).slice(2, 10)}`,
      shareEnabled: false,
      createdAt: now,
      updatedAt: now,
      collaborators: [
        {
          id: 'col-owner',
          name: user?.name || 'Workspace Owner',
          email: user?.email || 'builder@aegion.ai',
          role: 'Owner',
          invitedAt: now,
        },
      ],
      memory: {
        specification: `${category} architecture targeting ${language} (${langMeta.framework}) with PostgreSQL and decoupled Glass UI design tokens.`,
        userRoles: [...tpl.defaultRoles],
        businessRules: [
          'Enforce tenant isolation and RBAC checks on every mutating API route.',
          'Keep UI styling bound to CSS variables independent of backend services.',
        ],
        databaseSchema: [],
        apiDefinitions: [],
        acceptedChangeIds: [],
        promptHistory: initialPrompt ? [initialPrompt] : [],
      },
      files: [],
      versions: [
        {
          id: `ver-${Date.now()}`,
          version: 'v1.0.0',
          createdAt: now,
          author: user?.name || 'Builder',
          changeSummary: `Initialized ${category} project (${language} / ${langMeta.framework})`,
          language,
          framework: langMeta.framework,
          themeId: resolvedTheme,
          modules: [...tpl.coreModules],
          files: [],
          status: 'approved',
        },
      ],
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(id);
    recordAudit('CREATE_PROJECT', `${newProj.name} (${language})`, 'Allowed');
    notify(`Created ${newProj.name}`, 'success');
    return newProj;
  };

  const cloneProject = (projectId: string): Project | null => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return null;
    const now = new Date().toISOString();
    const cloned: Project = {
      ...source,
      id: `proj-${Date.now()}`,
      name: `${source.name} (Clone)`,
      shareToken: `shr_${Math.random().toString(36).slice(2, 10)}`,
      shareEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [cloned, ...prev]);
    setActiveProjectId(cloned.id);
    recordAudit('CLONE_PROJECT', cloned.name, 'Allowed');
    notify(`Cloned ${source.name}`, 'success');
    return cloned;
  };

  const toggleShareProject = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, shareEnabled: !p.shareEnabled } : p))
    );
    notify('Updated read-only preview sharing state', 'info');
  };

  const inviteCollaborator = (
    projectId: string,
    name: string,
    email: string,
    role: 'Editor' | 'Viewer'
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              collaborators: [
                ...p.collaborators,
                {
                  id: `col-${Date.now()}`,
                  name,
                  email,
                  role,
                  invitedAt: new Date().toISOString(),
                },
              ],
            }
          : p
      )
    );
    recordAudit('INVITE_COLLABORATOR', `${email} (${role})`, 'Allowed');
    notify(`Invited ${email} as ${role}`, 'success');
  };

  const updateProjectTheme = (
    projectId: string,
    themeId: string,
    customization?: ThemeCustomization
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              themeId,
              themeCustomization: customization ?? p.themeCustomization,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const updateProjectLanguage = (projectId: string, language: ProgrammingLanguage) => {
    const langMeta = SUPPORTED_LANGUAGES.find((l) => l.language === language) || SUPPORTED_LANGUAGES[0];
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              language,
              framework: langMeta.framework,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const updateProjectCategory = (projectId: string, category: AppCategory) => {
    const themeCat = mapAppCategoryToThemeCategory(category);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              category,
              themeCategory: themeCat,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const setProjectMessages = (projectId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setChatHistory((prev) => ({
      ...prev,
      [projectId]: updater(prev[projectId] || []),
    }));
  };

  const applyProposalToProject = (projectId: string, messageId: string, proposal: ChangeProposal) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextVersion = bumpMinorVersion(p.version);
        const mergedFiles = [...p.files];
        for (const newFile of proposal.files) {
          const idx = mergedFiles.findIndex((f) => f.path === newFile.path);
          if (idx >= 0) mergedFiles[idx] = newFile;
          else mergedFiles.push(newFile);
        }
        return {
          ...p,
          category: proposal.detectedCategory || p.category,
          themeCategory: mapAppCategoryToThemeCategory(proposal.detectedCategory || p.category),
          language: proposal.detectedLanguage || p.language,
          framework: proposal.detectedFramework || p.framework,
          frontendFramework: proposal.detectedFrontend || p.frontendFramework,
          database: proposal.database || p.database,
          authMethod: proposal.authMethod || p.authMethod,
          modules: proposal.modules.length > 0 ? proposal.modules : p.modules,
          files: mergedFiles,
          version: nextVersion,
          status: 'Active',
          updatedAt: now,
          memory: {
            specification: proposal.summary,
            userRoles: proposal.userRoles.length ? proposal.userRoles : p.memory.userRoles,
            businessRules: proposal.businessRules.length ? proposal.businessRules : p.memory.businessRules,
            databaseSchema: proposal.databaseSchema.length ? proposal.databaseSchema : p.memory.databaseSchema,
            apiDefinitions: proposal.apiDefinitions.length ? proposal.apiDefinitions : p.memory.apiDefinitions,
            acceptedChangeIds: [...p.memory.acceptedChangeIds, proposal.id],
            promptHistory: [...p.memory.promptHistory, proposal.summary],
          },
          versions: [
            ...p.versions,
            {
              id: `ver-${Date.now()}`,
              version: nextVersion,
              createdAt: now,
              author: user?.name || 'Builder',
              changeSummary: proposal.summary,
              language: proposal.detectedLanguage || p.language,
              framework: proposal.detectedFramework || p.framework,
              themeId: p.themeId,
              modules: proposal.modules.length > 0 ? proposal.modules : p.modules,
              files: mergedFiles,
              status: 'approved',
            },
          ],
        };
      })
    );

    setProjectMessages(projectId, (msgs) =>
      msgs.map((m) =>
        m.id === messageId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'approved' } }
          : m
      )
    );
    recordAudit('APPROVE_CHANGE_PROPOSAL', `${projectId} · ${proposal.summary}`, 'Allowed');
    notify('Approved architecture changes and saved new project version', 'success');
  };

  const rejectProposal = (projectId: string, messageId: string) => {
    setProjectMessages(projectId, (msgs) =>
      msgs.map((m) =>
        m.id === messageId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'rejected' } }
          : m
      )
    );
    notify('Change proposal discarded');
  };

  const rollbackProjectVersion = (projectId: string, versionId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const target = p.versions.find((v) => v.id === versionId);
        if (!target) return p;
        return {
          ...p,
          version: target.version,
          language: target.language,
          framework: target.framework,
          themeId: target.themeId,
          modules: target.modules,
          files: target.files.length > 0 ? target.files : p.files,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    recordAudit('ROLLBACK_PROJECT_VERSION', `${projectId} -> ${versionId}`, 'Allowed');
    notify('Rolled back project to selected snapshot', 'success');
  };

  const savePromptDraft = (promptId: string, content: string, changeDescription: string) => {
    setPrompts((prev) =>
      prev.map((pr) => {
        if (pr.id !== promptId) return pr;
        return {
          ...pr,
          previousVersion: pr.version,
          previousContent: pr.content,
          version: bumpMinorVersion(pr.version),
          content,
          changeDescription,
          status: 'Draft',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    recordAudit('SAVE_PROMPT_DRAFT', promptId, 'Allowed');
    notify('Saved prompt draft', 'success');
  };

  const approvePromptVersion = (promptId: string, note: string) => {
    if (user?.role !== 'super_admin') {
      recordAudit('APPROVE_PROMPT_VERSION', promptId, 'Denied');
      notify('Only Super Admins can approve prompt versions', 'error');
      return;
    }
    const now = new Date().toISOString();
    setPrompts((prev) =>
      prev.map((pr) => {
        if (pr.id !== promptId) return pr;
        return {
          ...pr,
          status: 'Approved',
          updatedAt: now,
          approvalHistory: [
            {
              version: pr.version,
              approvedBy: user.email,
              approvedAt: now,
              note: note || 'Approved for production LangGraph retrieval',
            },
            ...pr.approvalHistory,
          ],
        };
      })
    );
    recordAudit('APPROVE_PROMPT_VERSION', promptId, 'Allowed');
    notify(`Approved ${promptId}`, 'success');
  };

  const createPrompt = (entry: Omit<PromptEntry, 'id' | 'updatedAt' | 'approvalHistory'>) => {
    const newPrompt: PromptEntry = {
      ...entry,
      id: `PRM-${Math.floor(100 + Math.random() * 899)}`,
      updatedAt: new Date().toISOString(),
      approvalHistory: [],
    };
    setPrompts((prev) => [newPrompt, ...prev]);
    recordAudit('CREATE_PROMPT', newPrompt.name, 'Allowed');
    notify(`Added ${newPrompt.name} to registry`, 'success');
  };

  const updateThemeCustomization = (presetId: string, customization: ThemeCustomization) => {
    setThemeCustomizations((prev) => {
      const next = { ...prev, [presetId]: customization };
      saveThemeCustomizations(next);
      return next;
    });
    if (activeProject && activeProject.themeId === presetId) {
      updateProjectTheme(activeProject.id, presetId, customization);
    }
  };

  const createTicket = (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'userEmail'>) => {
    const created: SupportTicket = {
      ...ticket,
      id: `TKT-${Math.floor(2100 + Math.random() * 899)}`,
      status: 'Open',
      userEmail: user?.email || 'builder@aegion.ai',
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [created, ...prev]);
    notify(`Support ticket ${created.id} submitted`, 'success');
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    notify(`Ticket ${ticketId} marked ${status}`, 'info');
  };

  return (
    <AegionContext.Provider
      value={{
        route,
        navigate,
        user,
        authInitialized,
        runtimeMode,
        workspace,
        setAuthenticatedUser,
        updateCurrentUser,
        logout,
        updateWorkspace,
        googleAccessToken,
        connectGoogleWorkspace,
        pendingStatusInfo,
        setPendingStatusInfo,
        googlePrefill,
        setGooglePrefill,
        adminPortalEmailPrefill,
        setAdminPortalEmailPrefill,
        activationToken,
        setActivationToken,
        resetToken,
        setResetToken,
        adminResetToken,
        setAdminResetToken,
        verifyEmailToken,
        setVerifyEmailToken,
        platformCompactMode,
        setPlatformCompactMode,
        projects,
        activeProjectId,
        activeProject,
        setActiveProjectId,
        createProject,
        cloneProject,
        toggleShareProject,
        inviteCollaborator,
        updateProjectTheme,
        updateProjectLanguage,
        updateProjectCategory,
        applyProposalToProject,
        rejectProposal,
        rollbackProjectVersion,
        chatHistory,
        setProjectMessages,
        prompts,
        savePromptDraft,
        approvePromptVersion,
        createPrompt,
        themeCustomizations,
        updateThemeCustomization,
        tickets,
        createTicket,
        updateTicketStatus,
        auditLogs,
        recordAudit,
        selectedModel,
        setSelectedModel,
        sharedProject,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </AegionContext.Provider>
  );
};

export function useAegion() {
  const ctx = useContext(AegionContext);
  if (!ctx) {
    throw new Error('useAegion must be used inside AegionProvider');
  }
  return ctx;
}
