import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient, type AdminOverviewPayload } from '../services/apiClient';
import type { CustomerRegistration, NotificationChannelConfig } from '../types/registration';
import { GlassCard } from '../components/common/GlassCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SkeletonBlock } from '../components/common/MotionWrapper';

type AdminTab = 'registrations' | 'sheets' | 'notifications' | 'security' | 'platform';

interface PendingDecisionState {
  registration: CustomerRegistration;
  decision: 'approve' | 'reject' | 'request_info' | 'suspend' | 'reactivate';
}

export const AdminPage: React.FC = () => {
  const {
    user,
    projects,
    prompts,
    selectedModel,
    setSelectedModel,
    googleAccessToken,
    connectGoogleWorkspace,
    navigate,
    notify,
  } = useAegion();

  const [tab, setTab] = useState<AdminTab>('registrations');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [detailReg, setDetailReg] = useState<CustomerRegistration | null>(null);
  const [decisionModal, setDecisionModal] = useState<PendingDecisionState | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [lastActivationLink, setLastActivationLink] = useState<string | null>(null);

  const [sheetsConfirmOpen, setSheetsConfirmOpen] = useState(false);
  const [sheetsSyncing, setSheetsSyncing] = useState(false);

  // Notification config draft
  const [cfgDraft, setCfgDraft] = useState<NotificationChannelConfig | null>(null);
  const [waTokenInput, setWaTokenInput] = useState('');
  const [waVerifyTokenInput, setWaVerifyTokenInput] = useState('');
  const [resendKeyInput, setResendKeyInput] = useState('');
  const [sendgridKeyInput, setSendgridKeyInput] = useState('');
  const [testEmailTarget, setTestEmailTarget] = useState(user?.email || 'arigasaicharan@gmail.com');
  const [testWaPhone, setTestWaPhone] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<{ id: string; email: string; next: 'active' | 'suspended' } | null>(
    null
  );
  const [isolationMode, setIsolationMode] = useState('docker-sandbox');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminOverview();
      setOverview(data);
      setCfgDraft(data.notificationConfig);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load Super Admin console', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const countries = useMemo(() => {
    if (!overview) return [];
    return Array.from(new Set(overview.registrations.map((r) => r.country))).sort();
  }, [overview]);

  const filteredRegistrations = useMemo(() => {
    if (!overview) return [];
    return overview.registrations.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const matchesApp = appFilter === 'all' || r.applicationTypes.includes(appFilter as never);
      const matchesCountry = countryFilter === 'all' || r.country === countryFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesApp && matchesCountry && matchesStatus;
    });
  }, [overview, search, appFilter, countryFilter, statusFilter]);

  const handleConfirmDecision = async () => {
    if (!decisionModal) return;
    setDecisionSubmitting(true);
    try {
      const res = await apiClient.decideRegistration(
        decisionModal.registration.id,
        decisionModal.decision,
        decisionComments
      );
      if (res.activationLinkPreview) {
        setLastActivationLink(res.activationLinkPreview);
      }
      notify(
        `Registration ${decisionModal.registration.id} updated (${decisionModal.decision.replace('_', ' ')})`,
        'success'
      );
      setDecisionModal(null);
      setDecisionComments('');
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to apply decision', 'error');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await apiClient.exportRegistrationsCsv();
      notify('Downloaded registered customers CSV', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleWorkspace();
      notify('Google Workspace OAuth authorized for Sheets & Gmail', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Google Workspace connection cancelled', 'error');
    }
  };

  const handleConfirmSheetsSync = async () => {
    setSheetsSyncing(true);
    try {
      const res = await apiClient.syncGoogleSheets();
      notify(
        `Synced ${res.syncedRegistrations} registrations, ${res.syncedHistory} history rows, ${res.syncedLogs} logs to Google Sheets`,
        'success'
      );
      setSheetsConfirmOpen(false);
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Google Sheets sync failed', 'error');
    } finally {
      setSheetsSyncing(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgDraft) return;
    setSavingConfig(true);
    try {
      await apiClient.updateNotificationConfig({
        ...cfgDraft,
        whatsappAccessToken: waTokenInput || undefined,
        whatsappWebhookVerifyToken: waVerifyTokenInput || undefined,
        resendApiKey: resendKeyInput || undefined,
        sendgridApiKey: sendgridKeyInput || undefined,
      });
      setWaTokenInput('');
      setWaVerifyTokenInput('');
      setResendKeyInput('');
      setSendgridKeyInput('');
      notify('Notification & automation configuration saved', 'success');
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestNotification = async (channel: 'Email' | 'WhatsApp') => {
    try {
      const recipient = channel === 'Email' ? testEmailTarget : testWaPhone;
      const res = await apiClient.sendTestNotification(channel, recipient);
      notify(`${channel} test dispatch status: ${res.status}`, res.ok ? 'success' : 'info');
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Test dispatch failed', 'error');
    }
  };

  const handleConfirmUserStatus = async () => {
    if (!suspendTarget) return;
    try {
      await apiClient.updateUserStatus(suspendTarget.id, suspendTarget.next);
      notify(`Updated ${suspendTarget.email} to ${suspendTarget.next}`, 'success');
      setSuspendTarget(null);
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'User status update failed', 'error');
    }
  };

  if (loading && !overview) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <SkeletonBlock className="h-14" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 9 }).map((_, idx) => (
            <SkeletonBlock key={idx} className="h-24" />
          ))}
        </div>
        <SkeletonBlock className="h-96" />
      </div>
    );
  }

  const kpis = overview?.kpis;

  const kpiCards = [
    { label: 'Total Registrations', value: kpis?.totalRegistrations ?? 0 },
    { label: 'Pending Approvals', value: kpis?.pendingApprovals ?? 0, accent: 'text-amber-400' },
    { label: 'Approved Users', value: kpis?.approvedUsers ?? 0, accent: 'text-emerald-400' },
    { label: 'Active Projects', value: Math.max(projects.length, kpis?.activeProjects ?? 0) },
    { label: 'Apps Generated', value: kpis?.applicationsGenerated ?? 0 },
    { label: 'Failed Generations', value: kpis?.failedGenerations ?? 0 },
    { label: 'AI Usage (Tokens)', value: (kpis?.tokensConsumed ?? 0).toLocaleString() },
    { label: 'Notification Delivery', value: `${kpis?.notificationDeliveryRate ?? 100}%` },
    { label: 'Recent Activities', value: kpis?.recentActivitiesCount ?? 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Super Admin Control Plane</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Approval governance, Google Sheets & WhatsApp/Email automation, security audit logs, and RBAC exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={fetchOverview}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button type="button" size="sm" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Registrations CSV</span>
          </Button>
        </div>
      </div>

      {/* 9 Focused KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpiCards.map((card) => (
          <GlassCard key={card.label} padding="sm" className="space-y-1">
            <div className="text-[11px] text-[#9CA3AF] truncate">{card.label}</div>
            <div className={`text-xl font-bold font-display tabular-nums ${card.accent || 'text-white'}`}>
              {card.value}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-lg w-fit">
        {(
          [
            ['registrations', `Registrations (${overview?.registrations.length || 0})`],
            ['sheets', 'Google Sheets Sync'],
            ['notifications', 'Email & WhatsApp'],
            ['security', 'Users & Security'],
            ['platform', 'Models & Tickets'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
              tab === key ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Last Generated Activation Link Banner */}
      {lastActivationLink && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1 min-w-0">
            <div className="font-semibold text-emerald-300">Single-Use 24h Activation Link Generated</div>
            <div className="font-mono text-[#D1D5DB] break-all">{lastActivationLink}</div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLastActivationLink(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* TAB 1: Registration Management */}
      {tab === 'registrations' && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, company, ID..."
                className="w-full bg-[#14151C] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="bg-[#14151C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="all">All Application Types</option>
              <option value="HRMS">HRMS</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="Multi-Store Management">Multi-Store Management</option>
              <option value="SaaS Applications">SaaS Applications</option>
              <option value="Healthcare Store Management">Healthcare Store Management</option>
              <option value="Custom Business Applications">Custom Business Applications</option>
            </select>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-[#14151C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#14151C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Info Requested">Info Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <DataTable
            rows={filteredRegistrations}
            rowKey={(r) => r.id}
            emptyTitle="No customer registrations match the current filters."
            columns={[
              {
                key: 'applicant',
                header: 'Applicant',
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/25 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {r.fullName
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">{r.fullName}</div>
                      <div className="text-[11px] text-[#9CA3AF] truncate">{r.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'company',
                header: 'Company',
                render: (r) => (
                  <div>
                    <div className="text-white text-xs">{r.companyName}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{r.country}</div>
                  </div>
                ),
              },
              {
                key: 'appType',
                header: 'Application Type',
                render: (r) => (
                  <div>
                    <div className="text-xs text-[#D1D5DB]">{r.applicationTypes.join(', ')}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{r.preferredBackendLanguage}</div>
                  </div>
                ),
              },
              {
                key: 'theme',
                header: 'Theme Preference',
                render: (r) => (
                  <div className="text-xs text-[#9CA3AF]">
                    <div>{r.themeModePreference === 'dark' ? 'Dark' : 'Light'} Glass</div>
                    <div className="text-[11px] font-mono text-[#6B7280]">{r.selectedThemeId}</div>
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Submitted',
                render: (r) => (
                  <span className="text-xs text-[#9CA3AF] tabular-nums">
                    {new Date(r.submissionDate).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <span
                    className={`text-xs font-medium ${
                      r.status === 'Approved'
                        ? 'text-emerald-400'
                        : r.status === 'Pending Approval'
                        ? 'text-amber-400'
                        : r.status === 'Info Requested'
                        ? 'text-sky-400'
                        : 'text-red-400'
                    }`}
                  >
                    {r.status}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (r) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setDetailReg(r)}>
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Button>
                    {r.status !== 'Approved' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setDecisionModal({ registration: r, decision: 'approve' })}
                      >
                        Approve
                      </Button>
                    )}
                    {r.status !== 'Rejected' && r.status !== 'Suspended' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDecisionModal({ registration: r, decision: 'reject' })}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 2: Google Sheets Integration */}
      {tab === 'sheets' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard className="lg:col-span-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs text-[#A78BFA] font-medium">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>AEGION_AI_CUSTOMER_REGISTRATIONS</span>
                </div>
                <h2 className="text-lg font-bold text-white font-display">
                  Google Sheets Registration Ledger
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Server database remains authoritative; syncs 3 structured worksheets (Registrations, Approval History, Notification Logs) idempotently without duplicate rows.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#14151C] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Google Workspace OAuth Session</span>
                <span className={googleAccessToken ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                  {googleAccessToken ? 'Authorized in Memory' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Target Spreadsheet ID</span>
                <span className="font-mono text-white">
                  {overview.notificationConfig.sheetsSpreadsheetId || 'Created automatically on first sync'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Last Sync</span>
                <span className="tabular-nums text-[#D1D5DB]">
                  {overview.notificationConfig.lastSheetsSyncAt
                    ? new Date(overview.notificationConfig.lastSheetsSyncAt).toLocaleString()
                    : 'Not synced yet'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" onClick={handleConnectGoogle}>
                {googleAccessToken ? 'Reconnect Google Workspace' : 'Connect Google Workspace'}
              </Button>
              <Button
                type="button"
                disabled={!googleAccessToken}
                onClick={() => setSheetsConfirmOpen(true)}
              >
                Sync All Worksheets Now
              </Button>
              {overview.notificationConfig.sheetsSpreadsheetUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(overview.notificationConfig.sheetsSpreadsheetUrl);
                    notify('Copied Google Spreadsheet URL to clipboard', 'info');
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Copy Sheet URL</span>
                </Button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-semibold text-white font-display">Super Admin Export Controls</h3>
            <p className="text-xs text-[#9CA3AF]">
              Only the verified Super Admin account may export or download the platform customer registration spreadsheet. Standard builders receive HTTP 403 on all export routes.
            </p>
            <Button type="button" onClick={handleExportCsv} className="w-full">
              <Download className="w-4 h-4" />
              <span>Download Registrations CSV</span>
            </Button>
          </GlassCard>
        </div>
      )}

      {/* TAB 3: Email & WhatsApp Automation */}
      {tab === 'notifications' && cfgDraft && overview && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-white font-display">
                  <Mail className="w-4 h-4 text-[#A78BFA]" />
                  <span>Email Automation Pipeline</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#D1D5DB]">
                  <input
                    type="checkbox"
                    checked={cfgDraft.emailEnabled}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, emailEnabled: e.target.checked })}
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">Email Provider</span>
                  <select
                    value={cfgDraft.emailProvider}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        emailProvider: e.target.value as NotificationChannelConfig['emailProvider'],
                      })
                    }
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Gmail API">Gmail API (Workspace OAuth)</option>
                    <option value="SMTP">SMTP Relay</option>
                    <option value="Resend">Resend</option>
                    <option value="SendGrid">SendGrid</option>
                    <option value="Amazon SES">Amazon SES</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">Sender Email</span>
                  <input
                    type="email"
                    value={cfgDraft.senderEmail}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, senderEmail: e.target.value })}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              {cfgDraft.emailProvider === 'Resend' && (
                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">Resend API Key (stored server-side only)</span>
                  <input
                    type="password"
                    value={resendKeyInput}
                    onChange={(e) => setResendKeyInput(e.target.value)}
                    placeholder="re_..."
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </label>
              )}

              {cfgDraft.emailProvider === 'SendGrid' && (
                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">SendGrid API Key (stored server-side only)</span>
                  <input
                    type="password"
                    value={sendgridKeyInput}
                    onChange={(e) => setSendgridKeyInput(e.target.value)}
                    placeholder="SG..."
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </label>
              )}

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-[#D1D5DB]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyAdminOnNewRegistration}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyAdminOnNewRegistration: e.target.checked })
                    }
                  />
                  <span>Send new registration alert to Super Admin</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyUserOnReceived}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyUserOnReceived: e.target.checked })
                    }
                  />
                  <span>Send registration received confirmation to customer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyUserOnApproval}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyUserOnApproval: e.target.checked })
                    }
                  />
                  <span>Send approval & single-use activation email to customer</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  placeholder="Test recipient email"
                  className="flex-1 bg-[#181922] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => handleTestNotification('Email')}>
                  Test Email
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-white font-display">
                  <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
                  <span>WhatsApp Business Cloud API</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#D1D5DB]">
                  <input
                    type="checkbox"
                    checked={cfgDraft.whatsappEnabled}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, whatsappEnabled: e.target.checked })}
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">WhatsApp Business Account ID</span>
                  <input
                    type="text"
                    value={cfgDraft.whatsappBusinessAccountId}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, whatsappBusinessAccountId: e.target.value })
                    }
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#9CA3AF]">Phone Number ID</span>
                  <input
                    type="text"
                    value={cfgDraft.whatsappPhoneNumberId}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, whatsappPhoneNumberId: e.target.value })
                    }
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs text-[#9CA3AF]">
                  Cloud API Access Token ({cfgDraft.whatsappAccessTokenConfigured ? 'Configured on server' : 'Not set'})
                </span>
                <input
                  type="password"
                  value={waTokenInput}
                  onChange={(e) => setWaTokenInput(e.target.value)}
                  placeholder="Enter new permanent token to update (never exposed to browser)"
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-[#9CA3AF]">
                  Webhook Verify Token ({cfgDraft.whatsappWebhookVerifyTokenConfigured ? 'Configured' : 'Not set'})
                </span>
                <input
                  type="password"
                  value={waVerifyTokenInput}
                  onChange={(e) => setWaVerifyTokenInput(e.target.value)}
                  placeholder="Webhook verification secret"
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
              </label>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="tel"
                  value={testWaPhone}
                  onChange={(e) => setTestWaPhone(e.target.value)}
                  placeholder="+14155550192"
                  className="flex-1 bg-[#181922] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => handleTestNotification('WhatsApp')}>
                  Test WhatsApp
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={savingConfig}>
                  {savingConfig ? 'Saving...' : 'Save Automation Configuration'}
                </Button>
              </div>
            </GlassCard>
          </form>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white font-display">Notification Delivery Logs</h3>
            <DataTable
              rows={overview.notificationLogs}
              rowKey={(n) => n.id}
              columns={[
                { key: 'time', header: 'Sent At', render: (n) => <span className="text-xs tabular-nums text-[#9CA3AF]">{new Date(n.sentTimestamp).toLocaleString()}</span> },
                { key: 'channel', header: 'Channel', render: (n) => <span className="text-xs text-white">{n.channel}</span> },
                { key: 'template', header: 'Template', render: (n) => <span className="text-xs text-[#D1D5DB]">{n.template}</span> },
                { key: 'recipient', header: 'Recipient', render: (n) => <span className="text-xs text-[#9CA3AF]">{n.recipient}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  align: 'right',
                  render: (n) => (
                    <span
                      className={`text-xs font-medium ${
                        n.status === 'Sent'
                          ? 'text-emerald-400'
                          : n.status === 'Failed'
                          ? 'text-red-400'
                          : 'text-[#9CA3AF]'
                      }`}
                    >
                      {n.status}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB 4: Users & Security */}
      {tab === 'security' && overview && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white font-display">Platform User Accounts</h2>
              <div className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Server-enforced scrypt / Argon2id + RBAC</span>
              </div>
            </div>
            <DataTable
              rows={overview.users}
              rowKey={(u) => u.id}
              columns={[
                { key: 'name', header: 'Name', render: (u) => <span className="text-white font-medium">{u.name}</span> },
                { key: 'email', header: 'Email', render: (u) => <span className="text-[#9CA3AF]">{u.email}</span> },
                { key: 'role', header: 'Role', render: (u) => <span className="font-mono text-xs text-[#A78BFA]">{u.role}</span> },
                { key: 'status', header: 'Account Status', render: (u) => <span className="text-xs text-white">{u.status}</span> },
                {
                  key: 'action',
                  header: 'Control',
                  align: 'right',
                  render: (u) =>
                    u.role === 'super_admin' ? (
                      <span className="text-[11px] text-[#6B7280]">Protected Admin</span>
                    ) : u.status === 'suspended' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSuspendTarget({ id: u.id, email: u.email, next: 'active' })}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSuspendTarget({ id: u.id, email: u.email, next: 'suspended' })}
                      >
                        Suspend
                      </Button>
                    ),
                },
              ]}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white font-display">Security Audit Trail</h2>
            <DataTable
              rows={overview.auditLogs}
              rowKey={(a) => a.id}
              columns={[
                {
                  key: 'time',
                  header: 'Timestamp',
                  render: (a) => (
                    <span className="font-mono text-xs tabular-nums text-[#9CA3AF]">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  ),
                },
                { key: 'actor', header: 'Actor', render: (a) => <span className="text-xs text-white">{a.actorEmail}</span> },
                { key: 'action', header: 'Action', render: (a) => <span className="font-mono text-xs text-[#D1D5DB]">{a.action}</span> },
                { key: 'target', header: 'Target', render: (a) => <span className="text-xs text-[#9CA3AF]">{a.target}</span> },
                {
                  key: 'outcome',
                  header: 'Outcome',
                  align: 'right',
                  render: (a) => (
                    <span className={`text-xs font-medium ${a.outcome === 'Allowed' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {a.outcome}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB 5: AI Models, Prompt Registry, Themes, Support Tickets */}
      {tab === 'platform' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="space-y-4">
              <h2 className="text-base font-semibold text-white font-display">AI Model Provider Abstraction</h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Primary Orchestration Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    notify(`Updated active orchestration model to ${e.target.value}`, 'success');
                  }}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="gemini-4-hydrogen">gemini-4-hydrogen (Default Fast Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Low-Latency Drafts)</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => navigate('prompts')}>
                  Manage Prompt Registry ({prompts.length})
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => navigate('themes')}>
                  Manage Glass Themes (50)
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h2 className="text-base font-semibold text-white font-display">Execution Sandbox Policy</h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Container Runtime Target</span>
                <select
                  value={isolationMode}
                  onChange={(e) => {
                    setIsolationMode(e.target.value);
                    notify('Updated isolated runtime target', 'success');
                  }}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="docker-sandbox">Isolated Docker Container (Non-Root)</option>
                  <option value="cloud-run">Google Cloud Run Service</option>
                </select>
              </label>
            </GlassCard>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white font-display">Support Tickets</h2>
            <DataTable
              rows={overview.supportTickets}
              rowKey={(t) => t.id}
              columns={[
                { key: 'id', header: 'Ticket', render: (t) => <span className="font-mono text-xs text-[#A78BFA]">{t.id}</span> },
                {
                  key: 'subject',
                  header: 'Subject',
                  render: (t) => (
                    <div>
                      <div className="text-white font-medium">{t.subject}</div>
                      <div className="text-xs text-[#9CA3AF]">{t.userEmail}</div>
                    </div>
                  ),
                },
                { key: 'priority', header: 'Priority', render: (t) => <span className="text-xs text-[#D1D5DB]">{t.priority}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  align: 'right',
                  render: (t) => (
                    <select
                      value={t.status}
                      onChange={async (e) => {
                        await apiClient.updateAdminTicketStatus(t.id, e.target.value as typeof t.status);
                        await fetchOverview();
                      }}
                      className="bg-[#181922] border border-white/10 rounded-md px-2 py-1 text-xs text-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Registration Details Modal */}
      <Modal
        open={Boolean(detailReg)}
        onClose={() => setDetailReg(null)}
        title={detailReg ? `${detailReg.projectName} (${detailReg.id})` : 'Registration'}
        subtitle={detailReg ? `${detailReg.fullName} · ${detailReg.email} · ${detailReg.companyName}` : undefined}
        maxWidth="max-w-3xl"
      >
        {detailReg && overview && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#14151C] border border-white/10">
              <div><span className="text-[#9CA3AF]">Phone:</span> <span className="text-white">{detailReg.phone}</span></div>
              <div><span className="text-[#9CA3AF]">Country:</span> <span className="text-white">{detailReg.country}</span></div>
              <div><span className="text-[#9CA3AF]">Job Title:</span> <span className="text-white">{detailReg.jobTitle}</span></div>
              <div><span className="text-[#9CA3AF]">Apps:</span> <span className="text-white">{detailReg.applicationTypes.join(', ')}</span></div>
              <div><span className="text-[#9CA3AF]">Backend / DB:</span> <span className="text-white">{detailReg.preferredBackendLanguage} / {detailReg.preferredDatabase}</span></div>
              <div><span className="text-[#9CA3AF]">Theme Option:</span> <span className="text-white">{detailReg.themeOption}</span></div>
              <div className="sm:col-span-2"><span className="text-[#9CA3AF]">Description:</span> <span className="text-[#D1D5DB]">{detailReg.projectDescription}</span></div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Approval History</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {overview.approvalHistory
                  .filter((h) => h.registrationId === detailReg.id)
                  .map((h) => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-[#14151C] border border-white/10 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[#A78BFA]">{h.action}</span> · {h.previousStatus} → {h.newStatus}
                        <div className="text-[#9CA3AF]">{h.comments}</div>
                      </div>
                      <span className="text-[#6B7280] tabular-nums shrink-0">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = detailReg;
                  setDetailReg(null);
                  setDecisionModal({ registration: target, decision: 'request_info' });
                }}
              >
                Request Info
              </Button>
              {detailReg.status !== 'Suspended' ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = detailReg;
                    setDetailReg(null);
                    setDecisionModal({ registration: target, decision: 'suspend' });
                  }}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = detailReg;
                    setDetailReg(null);
                    setDecisionModal({ registration: target, decision: 'reactivate' });
                  }}
                >
                  Reactivate
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = detailReg;
                  setDetailReg(null);
                  setDecisionModal({ registration: target, decision: 'reject' });
                }}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const target = detailReg;
                  setDetailReg(null);
                  setDecisionModal({ registration: target, decision: 'approve' });
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Issue Activation</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal for Approve/Reject/RequestInfo/Suspend */}
      <Modal
        open={Boolean(decisionModal)}
        onClose={() => setDecisionModal(null)}
        title={
          decisionModal
            ? `Confirm ${decisionModal.decision.replace('_', ' ').toUpperCase()}`
            : 'Confirm Action'
        }
        subtitle={
          decisionModal
            ? `${decisionModal.registration.fullName} (${decisionModal.registration.email}) · ${decisionModal.registration.id}`
            : undefined
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#D1D5DB]">Admin Notes / Reason (Logged to Audit & Notifications)</span>
            <textarea
              rows={3}
              value={decisionComments}
              onChange={(e) => setDecisionComments(e.target.value)}
              placeholder="Enter approval remarks, requested clarifications, or rejection reason..."
              className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDecisionModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={decisionSubmitting} onClick={handleConfirmDecision}>
              {decisionSubmitting ? 'Applying...' : 'Confirm Decision'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Google Sheets Sync */}
      <Modal
        open={sheetsConfirmOpen}
        onClose={() => setSheetsConfirmOpen(false)}
        title="Confirm Google Sheets Synchronization"
        subtitle="Update AEGION_AI_CUSTOMER_REGISTRATIONS across Registrations, Approval History, and Notification Logs."
      >
        <div className="space-y-4 text-xs text-[#9CA3AF]">
          <p>
            This idempotently refreshes the 3 worksheets in your Google Sheet using the server database as the source of truth.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSheetsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={sheetsSyncing} onClick={handleConfirmSheetsSync}>
              {sheetsSyncing ? 'Syncing...' : 'Confirm & Sync'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for User Suspend/Reactivate */}
      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        title={suspendTarget?.next === 'suspended' ? 'Suspend User Account' : 'Reactivate User Account'}
        subtitle={suspendTarget?.email}
      >
        <div className="space-y-4 text-xs text-[#9CA3AF]">
          <p>
            {suspendTarget?.next === 'suspended'
              ? 'Suspending this account immediately revokes active sessions and blocks builder access.'
              : 'Reactivating restores builder access for this approved user.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmUserStatus}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
