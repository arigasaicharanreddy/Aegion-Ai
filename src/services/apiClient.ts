import type { UserAccount, UserRole } from '../types/auth';
import type { AuditLogEntry, SupportTicket } from '../types/project';
import type {
  ApprovalHistoryRecord,
  CustomerRegistration,
  NotificationChannelConfig,
  NotificationLogRecord,
} from '../types/registration';
import { getGoogleAccessToken } from './googleAuth';
import { mockDevApi, type RuntimeModeStatus } from '../config/mockDevApi';

export interface BackendHealthStatus {
  status: string;
  frontendRuntime: string;
  gatewayRuntime: string;
  freeDevMode?: boolean;
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
    activeProjects: number;
    applicationsGenerated: number;
    failedGenerations: number;
    tokensConsumed: number;
    notificationDeliveryRate: number;
    recentActivitiesCount: number;
  };
  registrations: CustomerRegistration[];
  approvalHistory: ApprovalHistoryRecord[];
  notificationLogs: NotificationLogRecord[];
  users: UserAccount[];
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicket[];
  notificationConfig: NotificationChannelConfig;
}

class AegionApiClient {
  private baseUrl: string;
  private sessionToken: string | null = null;
  private useMockFallback = false;

  constructor() {
    this.baseUrl = (import.meta.env?.VITE_AEGION_API_URL as string | undefined) || '';
  }

  isMockMode(): boolean {
    return this.useMockFallback;
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
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
    try {
      return await this.jsonFetch<BackendHealthStatus>('/api/v1/health');
    } catch {
      this.useMockFallback = true;
      return mockDevApi.getHealth();
    }
  }

  async getRuntimeMode(): Promise<RuntimeModeStatus> {
    try {
      return await this.jsonFetch<RuntimeModeStatus>('/api/v1/runtime/mode');
    } catch {
      this.useMockFallback = true;
      return mockDevApi.getRuntimeMode();
    }
  }

  async enterDevPreviewSession(role: 'builder' | 'super_admin') {
    try {
      const data = await this.jsonFetch<{
        ok: boolean;
        isDevPreview: boolean;
        sessionToken: string;
        user: UserAccount;
      }>('/api/v1/auth/dev-preview-session', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      this.useMockFallback = false;
      this.setSessionToken(data.sessionToken);
      return data;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 403) throw err;
      this.useMockFallback = true;
      const mock = mockDevApi.devPreviewSession(role);
      this.setSessionToken(mock.sessionToken);
      return { ok: true, isDevPreview: true, ...mock };
    }
  }

  async getCurrentSession(): Promise<{ authenticated: boolean; user: UserAccount | null }> {
    try {
      return await this.jsonFetch<{ authenticated: boolean; user: UserAccount | null }>('/api/v1/auth/me');
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

  async googleAuthExchange(idToken: string, portalMode: 'builder' | 'admin' = 'builder') {
    const data = await this.jsonFetch<{
      status: 'authenticated' | 'pending_approval' | 'needs_registration';
      sessionToken?: string;
      user?: UserAccount;
      registrationStatus?: string;
      registrationId?: string;
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

  async logout() {
    await this.jsonFetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    this.setSessionToken(null);
  }

  async submitRegistration(payload: Record<string, unknown>) {
    try {
      return await this.jsonFetch<{
        registrationId: string;
        status: string;
        submissionDate: string;
        projectName: string;
        email: string;
      }>('/api/v1/registrations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status && status >= 400 && status < 500) throw err;
      return mockDevApi.submitRegistration(payload);
    }
  }

  async checkRegistrationStatus(query: { email?: string; id?: string }) {
    const params = new URLSearchParams();
    if (query.email) params.set('email', query.email);
    if (query.id) params.set('id', query.id);
    try {
      return await this.jsonFetch<{
        registrationId: string;
        projectName: string;
        fullName: string;
        status: string;
        submissionDate: string;
        approvalDate?: string;
        adminComments?: string;
      }>(`/api/v1/registrations/status?${params.toString()}`);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status && status >= 400 && status < 500) throw err;
      return mockDevApi.checkRegistrationStatus(query);
    }
  }

  async getAdminOverview(): Promise<AdminOverviewPayload> {
    if (this.useMockFallback) {
      return mockDevApi.getAdminOverview();
    }
    try {
      return await this.jsonFetch<AdminOverviewPayload>('/api/v1/admin/overview');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) throw err;
      return mockDevApi.getAdminOverview();
    }
  }

  async decideRegistration(
    registrationId: string,
    decision: 'approve' | 'reject' | 'request_info' | 'suspend' | 'reactivate',
    comments: string
  ) {
    if (this.useMockFallback) {
      return mockDevApi.decideRegistration(registrationId, decision, comments);
    }
    try {
      return await this.jsonFetch<{
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
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status && status >= 400 && status < 500) throw err;
      return mockDevApi.decideRegistration(registrationId, decision, comments);
    }
  }

  async exportRegistrationsCsv(): Promise<void> {
    const res = await fetch(this.getEndpoint('/api/v1/admin/registrations/export'), {
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
    a.download = `AEGION_AI_CUSTOMER_REGISTRATIONS_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async syncGoogleSheets() {
    return this.jsonFetch<{
      ok: boolean;
      spreadsheetId: string;
      spreadsheetUrl: string;
      syncedRegistrations: number;
      syncedHistory: number;
      syncedLogs: number;
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
