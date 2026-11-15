import type {
  PlatformThemeGovernanceConfig,
  PlatformThemePreference,
  UserAccount,
  UserPreferences,
  UserRole,
} from '../types/auth';
import type { AuditLogEntry, SupportTicket } from '../types/project';
import type {
  ApprovalHistoryRecord,
  ContactCategory,
  ContactInquiry,
  ContactInquiryStatus,
  CustomerRegistration,
  NotificationChannelConfig,
  NotificationLogRecord,
} from '../types/registration';
import { getGoogleAccessToken } from './googleAuth';

export interface RuntimeModeStatus {
  nodeEnv: string;
  pythonBackendConfigured: boolean;
  geminiConfigured: boolean;
  emailConfigured: boolean;
  whatsappConfigured: boolean;
  superAdminConfigured: boolean;
}

export interface BackendHealthStatus {
  status: string;
  frontendRuntime: string;
  gatewayRuntime: string;
  pythonBackendConfigured: boolean;
  pythonBackendUrl: string | null;
  geminiConfigured?: boolean;
  aiModel: string;
  timestamp: string;
}

export interface AdminOverviewPayload {
  kpis: {
    totalRegistrations: number;
    pendingApprovals: number;
    approvedUsers: number;
    activeUsers: number;
    rejectedRegistrations: number;
    contactInquiriesCount: number;
    activeProjects: number;
    applicationsGenerated: number;
    failedGenerations: number;
    tokensConsumed: number;
    notificationDeliveryRate: number;
    recentActivitiesCount: number;
  };
  emailConfigured: boolean;
  whatsappConfigured: boolean;
  registrations: CustomerRegistration[];
  contactInquiries: ContactInquiry[];
  approvalHistory: ApprovalHistoryRecord[];
  notificationLogs: NotificationLogRecord[];
  users: UserAccount[];
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicket[];
  notificationConfig: NotificationChannelConfig;
  platformThemeConfig?: PlatformThemeGovernanceConfig;
}

export interface AssistantProjectContext {
  name?: string;
  category?: string;
  language?: string;
  framework?: string;
  modules?: string[];
  specification?: string;
}

export interface ProfileUpdatePayload {
  name: string;
  workspaceName?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  country?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
}

const SESSION_TOKEN_STORAGE_KEY = 'aegion_session_token_v1';

class AegionApiClient {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseUrl = (import.meta.env?.VITE_AEGION_API_URL as string | undefined) || '';
    if (typeof window !== 'undefined') {
      try {
        this.sessionToken = window.sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
      } catch {
        this.sessionToken = null;
      }
    }
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          window.sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        } else {
          window.sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        }
      } catch {
        // ignore sessionStorage restriction
      }
    }
  }

  getAuthHeaders(includeGoogleToken = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers.Authorization = `Bearer ${this.sessionToken}`;
    }
    if (includeGoogleToken) {
      const gToken = getGoogleAccessToken();
      if (gToken) {
        headers['x-google-access-token'] = gToken;
      }
    }
    return headers;
  }

  getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async jsonFetch<T>(
    path: string,
    init: RequestInit = {},
    includeGoogleToken = false
  ): Promise<T> {
    const res = await fetch(this.getEndpoint(path), {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(includeGoogleToken),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data as { error?: string }).error || `Request failed (${res.status})`) as Error & {
        status?: number;
        payload?: unknown;
      };
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data as T;
  }

  async getHealth(): Promise<BackendHealthStatus> {
    return this.jsonFetch<BackendHealthStatus>('/api/v1/health');
  }

  async getRuntimeMode(): Promise<RuntimeModeStatus> {
    return this.jsonFetch<RuntimeModeStatus>('/api/v1/runtime/mode');
  }

  async getCurrentSession(): Promise<{ authenticated: boolean; user: UserAccount | null }> {
    try {
      const res = await this.jsonFetch<{ authenticated: boolean; user: UserAccount | null }>(
        '/api/v1/auth/me'
      );
      if (!res.authenticated) {
        this.setSessionToken(null);
      }
      return res;
    } catch {
      return { authenticated: false, user: null };
    }
  }

  async adminLogin(email: string, password: string, mfaCode?: string) {
    const data = await this.jsonFetch<{
      sessionToken: string;
      mustChangePassword: boolean;
      user: UserAccount;
    }>('/api/v1/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, mfaCode }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async adminForgotPassword(email: string) {
    return this.jsonFetch<{
      ok: boolean;
      emailConfigured: boolean;
      deliveryStatus?: string;
      message: string;
    }>('/api/v1/auth/admin/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async adminResetPassword(token: string, password: string) {
    return this.jsonFetch<{ ok: boolean }>('/api/v1/auth/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async adminChangePassword(currentPassword: string, newPassword: string) {
    const data = await this.jsonFetch<{
      ok: boolean;
      sessionToken: string;
      user: UserAccount;
    }>('/api/v1/auth/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async builderLogin(email: string, password: string) {
    const data = await this.jsonFetch<{
      sessionToken: string;
      user: UserAccount;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async updateProfile(payload: ProfileUpdatePayload) {
    return this.jsonFetch<{
      ok: boolean;
      user: UserAccount;
    }>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getPlatformThemeConfig() {
    return this.jsonFetch<{ config: PlatformThemeGovernanceConfig }>('/api/v1/platform-themes/config');
  }

  async saveUserThemePreference(payload: Partial<PlatformThemePreference>) {
    return this.jsonFetch<{
      ok: boolean;
      appliedFallback?: boolean;
      warning?: string;
      user: UserAccount;
    }>('/api/v1/auth/theme-preference', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminPlatformThemeConfig(payload: Partial<PlatformThemeGovernanceConfig>) {
    return this.jsonFetch<{
      ok: boolean;
      config: PlatformThemeGovernanceConfig;
    }>('/api/v1/admin/platform-themes/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async requestEmailChange(newEmail: string, currentPassword?: string) {
    return this.jsonFetch<{
      ok: boolean;
      pendingEmail: string;
      message: string;
    }>(
      '/api/v1/auth/request-email-change',
      {
        method: 'POST',
        body: JSON.stringify({ newEmail, currentPassword }),
      },
      true
    );
  }

  async verifyEmailChange(token: string) {
    const data = await this.jsonFetch<{
      ok: boolean;
      sessionToken: string;
      user: UserAccount;
    }>('/api/v1/auth/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const data = await this.jsonFetch<{
      ok: boolean;
      sessionToken: string;
      user: UserAccount;
    }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async assistantChat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    message: string,
    projectContext?: AssistantProjectContext
  ) {
    return this.jsonFetch<{
      reply: string;
      model: string;
    }>('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, message, projectContext }),
    });
  }

  async streamAssistantChat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    message: string,
    handlers: {
      projectContext?: AssistantProjectContext;
      onToken: (chunk: string) => void;
      onDone?: (model: string) => void;
    }
  ): Promise<void> {
    const res = await fetch(this.getEndpoint('/api/v1/assistant/stream'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(false),
      },
      body: JSON.stringify({ messages, message, projectContext: handlers.projectContext }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || `Assistant stream failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (!dataLine) continue;
        const parsed = JSON.parse(dataLine) as { text?: string; model?: string; message?: string };
        if (eventName === 'token' && parsed.text) {
          handlers.onToken(parsed.text);
        } else if (eventName === 'error') {
          throw new Error(parsed.message || 'Assistant response failed.');
        } else if (eventName === 'done') {
          handlers.onDone?.(parsed.model || 'gemini-4-hydrogen');
        }
      }
    }
  }

  async googleAuthExchange(idToken: string, portalMode: 'builder' | 'admin' = 'builder') {
    const data = await this.jsonFetch<{
      status: 'authenticated' | 'pending_approval' | 'needs_registration';
      sessionToken?: string;
      user?: UserAccount;
      accountStatus?: string;
      registrationStatus?: string;
      registrationId?: string;
      message?: string;
      email?: string;
      name?: string;
      adminComments?: string;
      profile?: { email: string; fullName: string; avatarUrl?: string };
    }>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, portalMode }),
    });
    if (data.sessionToken) {
      this.setSessionToken(data.sessionToken);
    }
    return data;
  }

  async activateAccount(token: string, password: string) {
    const data = await this.jsonFetch<{
      ok: boolean;
      sessionToken: string;
      user: UserAccount;
    }>('/api/v1/auth/activate', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    this.setSessionToken(data.sessionToken);
    return data;
  }

  async requestPasswordReset(email: string) {
    return this.jsonFetch<{ ok: boolean; message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetUserPassword(token: string, password: string) {
    return this.jsonFetch<{ ok: boolean }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async logout() {
    await this.jsonFetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    this.setSessionToken(null);
  }

  async submitRegistration(payload: Record<string, unknown>) {
    return this.jsonFetch<{
      registrationId: string;
      status: string;
      submissionDate: string;
      projectName: string;
      email: string;
    }>('/api/v1/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitContactInquiry(payload: {
    fullName: string;
    email: string;
    company: string;
    phone?: string;
    subject: string;
    category: ContactCategory;
    message: string;
    website_hp?: string;
  }) {
    return this.jsonFetch<{
      ok: boolean;
      inquiryId: string;
      message: string;
      emailNotificationStatus: string;
    }>('/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async checkRegistrationStatus(query: { email?: string; id?: string }) {
    const params = new URLSearchParams();
    if (query.email) params.set('email', query.email);
    if (query.id) params.set('id', query.id);
    return this.jsonFetch<{
      registrationId: string;
      projectName: string;
      fullName: string;
      status: string;
      submissionDate: string;
      approvalDate?: string;
      adminComments?: string;
    }>(`/api/v1/registrations/status?${params.toString()}`);
  }

  async getAdminOverview(): Promise<AdminOverviewPayload> {
    return this.jsonFetch<AdminOverviewPayload>('/api/v1/admin/overview');
  }

  async decideRegistration(
    registrationId: string,
    decision: 'approve' | 'reject' | 'request_info' | 'suspend' | 'reactivate',
    comments: string
  ) {
    return this.jsonFetch<{
      ok: boolean;
      registration: CustomerRegistration;
      activationLinkPreview?: string;
    }>(
      `/api/v1/admin/registrations/${encodeURIComponent(registrationId)}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, comments }),
      },
      true
    );
  }

  async updateAdminContactInquiry(
    inquiryId: string,
    payload: { status?: ContactInquiryStatus; adminNotes?: string }
  ) {
    return this.jsonFetch<{ ok: boolean; inquiry: ContactInquiry }>(
      `/api/v1/admin/contacts/${encodeURIComponent(inquiryId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async exportRegistrations(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const res = await fetch(this.getEndpoint(`/api/v1/admin/registrations/export?format=${format}`), {
      credentials: 'include',
      headers: this.getAuthHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Export forbidden' }));
      throw new Error(err.error || 'Only Super Admin can download registrations.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AEGION_AI_CUSTOMER_REGISTRATIONS_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async exportRegistrationsCsv(): Promise<void> {
    return this.exportRegistrations('csv');
  }

  async exportContacts(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const res = await fetch(this.getEndpoint(`/api/v1/admin/contacts/export?format=${format}`), {
      credentials: 'include',
      headers: this.getAuthHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Export forbidden' }));
      throw new Error(err.error || 'Only Super Admin can download contact sheets.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AEGION_AI_CONTACT_INQUIRIES_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async exportContactsCsv(): Promise<void> {
    return this.exportContacts('csv');
  }

  async syncGoogleSheets() {
    return this.jsonFetch<{
      ok: boolean;
      spreadsheetId: string;
      spreadsheetUrl: string;
      contactSpreadsheetId: string;
      contactSpreadsheetUrl: string;
      syncedRegistrations: number;
      syncedHistory: number;
      syncedLogs: number;
      syncedContacts: number;
    }>('/api/v1/admin/sheets/sync', { method: 'POST' }, true);
  }

  async updateNotificationConfig(payload: Record<string, unknown>) {
    return this.jsonFetch<{ ok: boolean; notificationConfig: NotificationChannelConfig }>(
      '/api/v1/admin/notifications/config',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async sendTestNotification(channel: 'Email' | 'WhatsApp', recipient: string) {
    return this.jsonFetch<{ ok: boolean; status: string }>(
      '/api/v1/admin/notifications/test',
      {
        method: 'POST',
        body: JSON.stringify({ channel, recipient }),
      },
      true
    );
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    return this.jsonFetch<{ ok: boolean; user: UserAccount }>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
  }

  async updateAdminTicketStatus(ticketId: string, status: SupportTicket['status']) {
    return this.jsonFetch<{ ok: boolean }>(`/api/v1/admin/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async authorizePromptAction(
    _role: UserRole,
    action: 'view' | 'edit' | 'approve' | 'delete',
    layer: string,
    isProtected: boolean
  ): Promise<{ allowed: boolean; reason?: string }> {
    return this.jsonFetch<{ allowed: boolean; reason?: string }>('/api/v1/prompts/authorize', {
      method: 'POST',
      body: JSON.stringify({ action, layer, isProtected }),
    });
  }

  async fetchPythonScaffold(): Promise<{ files: { path: string; content: string }[] }> {
    return this.jsonFetch<{ files: { path: string; content: string }[] }>('/api/v1/python-scaffold');
  }
}

export const apiClient = new AegionApiClient();
