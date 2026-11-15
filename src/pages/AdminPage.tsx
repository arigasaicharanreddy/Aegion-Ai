import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
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
  UserCog,
  XCircle,
} from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { usePlatformTheme } from '../context/PlatformThemeContext';
import { apiClient, type AdminOverviewPayload } from '../services/apiClient';
import type {
  ContactCategory,
  ContactInquiry,
  ContactInquiryStatus,
  CustomerRegistration,
  NotificationChannelConfig,
} from '../types/registration';
import { GlassCard } from '../components/common/GlassCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SkeletonBlock } from '../components/common/MotionWrapper';
import { PlatformThemeGallery } from '../components/platform-themes/PlatformThemeGallery';
import { PLATFORM_THEMES } from '../platform-themes/catalog';

type AdminTab =
  | 'registrations'
  | 'contacts'
  | 'sheets'
  | 'notifications'
  | 'themes'
  | 'security'
  | 'platform';

interface PendingDecisionState {
  registration: CustomerRegistration;
  decision: 'approve' | 'reject' | 'request_info' | 'suspend' | 'reactivate';
}

const CONTACT_CATEGORIES: ContactCategory[] = [
  'General Inquiry',
  'Business Partnership',
  'Product Information',
  'Technical Support',
  'Workspace Access',
  'Other',
];

export const AdminPage: React.FC = () => {
  const {
    user,
    prompts,
    selectedModel,
    setSelectedModel,
    googleAccessToken,
    connectGoogleWorkspace,
    navigate,
    notify,
  } = useAegion();
  const { refreshGovernanceConfig } = usePlatformTheme();

  const [tab, setTab] = useState<AdminTab>('registrations');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);

  // Registration Filters
  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Contact Inquiry Filters & Modal
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');
  const [detailContact, setDetailContact] = useState<ContactInquiry | null>(null);
  const [contactStatusDraft, setContactStatusDraft] = useState<ContactInquiryStatus>('New');
  const [contactNotesDraft, setContactNotesDraft] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Registration Modals
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
  const [testEmailTarget, setTestEmailTarget] = useState(user?.email || '');
  const [testWaPhone, setTestWaPhone] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    email: string;
    next: 'active' | 'suspended';
  } | null>(null);
  const [isolationMode, setIsolationMode] = useState('docker-sandbox');

  useEffect(() => {
    if (user?.email) {
      setTestEmailTarget((prev) => prev || user.email);
    }
  }, [user?.email]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminOverview();
      setOverview(data);
      setCfgDraft(data.notificationConfig);
      void refreshGovernanceConfig();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load Super Admin console', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify, refreshGovernanceConfig]);

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
      const effectiveStatus = r.accountStatus || r.status;
      const matchesStatus =
        statusFilter === 'all' || r.status === statusFilter || effectiveStatus === statusFilter;
      return matchesSearch && matchesApp && matchesCountry && matchesStatus;
    });
  }, [overview, search, appFilter, countryFilter, statusFilter]);

  const filteredContacts = useMemo(() => {
    if (!overview) return [];
    return (overview.contactInquiries || []).filter((c) => {
      const q = contactSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesCategory = contactCategoryFilter === 'all' || c.category === contactCategoryFilter;
      const matchesStatus = contactStatusFilter === 'all' || c.status === contactStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [overview, contactSearch, contactCategoryFilter, contactStatusFilter]);

  const handleOpenContactDetail = (inquiry: ContactInquiry) => {
    setDetailContact(inquiry);
    setContactStatusDraft(inquiry.status);
    setContactNotesDraft(inquiry.adminNotes || '');
  };

  const handleSaveContactDetail = async (overrideStatus?: ContactInquiryStatus) => {
    if (!detailContact) return;
    const nextStatus = overrideStatus || contactStatusDraft;
    setSavingContact(true);
    try {
      await apiClient.updateAdminContactInquiry(detailContact.id, {
        status: nextStatus,
        adminNotes: contactNotesDraft,
      });
      notify(`Updated inquiry ${detailContact.id} (${nextStatus})`, 'success');
      setDetailContact(null);
      await fetchOverview();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update inquiry', 'error');
    } finally {
      setSavingContact(false);
    }
  };

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

  const handleExportRegistrations = async (format: 'csv' | 'xlsx') => {
    try {
      await apiClient.exportRegistrations(format);
      notify(`Downloaded registrations (${format.toUpperCase()})`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleExportContacts = async (format: 'csv' | 'xlsx') => {
    try {
      await apiClient.exportContacts(format);
      notify(`Downloaded contact inquiries (${format.toUpperCase()})`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Contact sheet export failed', 'error');
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
        `Synced ${res.syncedRegistrations} registrations & ${res.syncedContacts} contact inquiries to Google Sheets`,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
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
    { label: 'Active Users', value: kpis?.activeUsers ?? 0, accent: 'text-sky-400' },
    { label: 'Rejected Registrations', value: kpis?.rejectedRegistrations ?? 0, accent: 'text-red-400' },
    { label: 'Contact Inquiries', value: kpis?.contactInquiriesCount ?? 0 },
    { label: 'Recent Activities', value: kpis?.recentActivitiesCount ?? 0 },
    {
      label: 'Notification Status',
      value: overview?.emailConfigured ? 'Email Ready' : 'Config Needed',
      accent: overview?.emailConfigured ? 'text-emerald-400' : 'text-amber-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
            Super Admin Control Plane
          </h1>
          <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
            Workspace registration approvals, contact inquiry spreadsheets, Google Sheets sync, Platform Theme Governance, and security controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('settings')}>
            <UserCog className="w-3.5 h-3.5" />
            <span>Admin Profile</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={fetchOverview}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleExportRegistrations('csv')}>
            <Download className="w-3.5 h-3.5" />
            <span>Registrations CSV</span>
          </Button>
          <Button type="button" size="sm" onClick={() => handleExportRegistrations('xlsx')}>
            <Download className="w-3.5 h-3.5" />
            <span>Registrations XLSX</span>
          </Button>
        </div>
      </div>

      {/* Warning when email delivery is not yet configured */}
      {overview && !overview.emailConfigured && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Email notifications are not configured yet. Connect Gmail API OAuth or configure Resend / SendGrid / SMTP to deliver activation links and inquiry alerts automatically.
            </span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setTab('notifications')}>
            Configure Notifications
          </Button>
        </div>
      )}

      {/* 8 Focused KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {kpiCards.map((card) => (
          <GlassCard key={card.label} padding="sm" className="space-y-1">
            <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">{card.label}</div>
            <div className={`text-xl font-bold font-display tabular-nums ${card.accent || 'text-[var(--aegion-platform-text)]'}`}>
              {card.value}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] aegion-btn-shape w-fit">
        {(
          [
            ['registrations', `Registrations (${overview?.registrations.length || 0})`],
            ['contacts', `Contact Inquiries (${overview?.contactInquiries?.length || 0})`],
            ['sheets', 'Google Sheets Sync'],
            ['notifications', 'Email & WhatsApp'],
            ['themes', `Platform Themes (${PLATFORM_THEMES.length})`],
            ['security', 'Users & Security'],
            ['platform', 'Models & Tickets'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer aegion-btn-shape ${
              tab === key
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
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
              <Search className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, company, ID..."
                className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] pl-9 pr-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
              />
            </div>

            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
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
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
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
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved — Awaiting Activation">Approved — Awaiting Activation</option>
              <option value="Active">Active</option>
              <option value="Info Requested">Info Requested</option>
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
                    <div className="w-7 h-7 rounded-lg bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center text-xs font-semibold text-[var(--aegion-platform-text)] shrink-0">
                      {r.fullName
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[var(--aegion-platform-text)] font-medium truncate">{r.fullName}</div>
                      <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">{r.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'company',
                header: 'Company',
                render: (r) => (
                  <div>
                    <div className="text-[var(--aegion-platform-text)] text-xs">{r.companyName}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{r.country}</div>
                  </div>
                ),
              },
              {
                key: 'appType',
                header: 'Application Type',
                render: (r) => (
                  <div>
                    <div className="text-xs text-[var(--aegion-platform-text-secondary)]">{r.applicationTypes.join(', ')}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{r.projectName}</div>
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Submitted',
                render: (r) => (
                  <span className="text-xs text-[var(--aegion-platform-text-muted)] tabular-nums">
                    {new Date(r.submissionDate).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Access Status',
                render: (r) => {
                  const display = r.accountStatus || r.status;
                  return (
                    <span
                      className={`text-xs font-medium ${
                        display === 'Active'
                          ? 'text-emerald-400'
                          : display.startsWith('Approved')
                          ? 'text-sky-400'
                          : display === 'Pending Approval'
                          ? 'text-amber-400'
                          : display === 'Info Requested'
                          ? 'text-sky-400'
                          : 'text-red-400'
                      }`}
                    >
                      {display}
                    </span>
                  );
                },
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

      {/* TAB 2: Contact Inquiries (Super Admin Only) */}
      {tab === 'contacts' && overview && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                Contact Us Inquiries Management &amp; Export
              </h2>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Dedicated Contact Inquiries dataset (AEGION_AI_CONTACT_INQUIRIES). Download access is restricted exclusively to the Super Admin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => handleExportContacts('csv')}>
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </Button>
              <Button type="button" size="sm" onClick={() => handleExportContacts('xlsx')}>
                <Download className="w-3.5 h-3.5" />
                <span>Download XLSX</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contact, email, subject, ID..."
                className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] pl-9 pr-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
              />
            </div>

            <select
              value={contactCategoryFilter}
              onChange={(e) => setContactCategoryFilter(e.target.value)}
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
            >
              <option value="all">All Categories</option>
              {CONTACT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={contactStatusFilter}
              onChange={(e) => setContactStatusFilter(e.target.value)}
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <DataTable
            rows={filteredContacts}
            rowKey={(c) => c.id}
            emptyTitle="No contact inquiries match your filters."
            columns={[
              {
                key: 'id',
                header: 'Inquiry ID',
                render: (c) => <span className="font-mono text-xs text-[var(--aegion-platform-accent)]">{c.id}</span>,
              },
              {
                key: 'sender',
                header: 'Contact & Company',
                render: (c) => (
                  <div>
                    <div className="text-[var(--aegion-platform-text)] font-medium text-xs">{c.fullName}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{c.email}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{c.company || '—'}</div>
                  </div>
                ),
              },
              {
                key: 'subject',
                header: 'Category & Subject',
                render: (c) => (
                  <div className="max-w-sm space-y-0.5">
                    <div className="text-[11px] text-[var(--aegion-platform-accent)]">{c.category}</div>
                    <div className="text-xs text-[var(--aegion-platform-text)] font-medium truncate">{c.subject}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)] line-clamp-1">{c.message}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Inquiry Status',
                render: (c) => (
                  <span
                    className={`text-xs font-medium ${
                      c.status === 'Resolved'
                        ? 'text-emerald-400'
                        : c.status === 'In Review'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {c.status}
                  </span>
                ),
              },
              {
                key: 'date',
                header: 'Submitted',
                render: (c) => (
                  <span className="text-xs text-[var(--aegion-platform-text-muted)] tabular-nums">
                    {new Date(c.submittedAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (c) => (
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleOpenContactDetail(c)}>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 3: Google Sheets Integration (2 Dedicated Workbooks) */}
      {tab === 'sheets' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard className="lg:col-span-7 space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-accent)] font-medium">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Dual Google Spreadsheets Integration</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--aegion-platform-text)] font-display">
                Synchronized Registrations &amp; Contact Inquiries Workbooks
              </h2>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Automatically provisions and syncs two separate Google Spreadsheets without duplicate rows:
                <strong> AEGION_AI_CUSTOMER_REGISTRATIONS</strong> (Registrations, Approval History, Notification Logs) and{' '}
                <strong>AEGION_AI_CONTACT_INQUIRIES</strong> (Contact Inquiries).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--aegion-platform-text-muted)]">Google Workspace OAuth Session</span>
                <span className={googleAccessToken ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                  {googleAccessToken ? 'Authorized in Memory' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--aegion-platform-text-muted)]">Registrations Spreadsheet ID</span>
                <span className="font-mono text-[var(--aegion-platform-text)] truncate">
                  {overview.notificationConfig.sheetsSpreadsheetId || 'Auto-created on first sync'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--aegion-platform-text-muted)]">Contact Inquiries Spreadsheet ID</span>
                <span className="font-mono text-[var(--aegion-platform-text)] truncate">
                  {overview.notificationConfig.contactSpreadsheetId || 'Auto-created on first sync'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--aegion-platform-text-muted)]">Last Sync</span>
                <span className="tabular-nums text-[var(--aegion-platform-text-secondary)]">
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
              <Button type="button" disabled={!googleAccessToken} onClick={() => setSheetsConfirmOpen(true)}>
                Sync Both Spreadsheets Now
              </Button>
              {overview.notificationConfig.sheetsSpreadsheetUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(overview.notificationConfig.sheetsSpreadsheetUrl);
                    notify('Copied Registrations Spreadsheet URL', 'info');
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Copy Registrations Sheet URL</span>
                </Button>
              )}
              {overview.notificationConfig.contactSpreadsheetUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(overview.notificationConfig.contactSpreadsheetUrl || '');
                    notify('Copied Contact Inquiries Spreadsheet URL', 'info');
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Copy Contact Sheet URL</span>
                </Button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
              Super Admin Export Controls
            </h3>
            <p className="text-xs text-[var(--aegion-platform-text-muted)]">
              Only the verified Super Admin ({user?.email || 'Super Admin'}) may download or export registration and contact inquiry spreadsheets. All non-admin accounts receive HTTP 403.
            </p>
            <div className="space-y-2.5">
              <Button type="button" onClick={() => handleExportRegistrations('xlsx')} className="w-full">
                <Download className="w-4 h-4" />
                <span>Download Registrations (XLSX)</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExportRegistrations('csv')}
                className="w-full"
              >
                <Download className="w-4 h-4" />
                <span>Download Registrations (CSV)</span>
              </Button>
              <Button type="button" onClick={() => handleExportContacts('xlsx')} className="w-full">
                <Download className="w-4 h-4" />
                <span>Download Contact Inquiries (XLSX)</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExportContacts('csv')}
                className="w-full"
              >
                <Download className="w-4 h-4" />
                <span>Download Contact Inquiries (CSV)</span>
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 4: Email & WhatsApp Automation */}
      {tab === 'notifications' && cfgDraft && overview && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                  <Mail className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
                  <span>Email Automation Pipeline</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--aegion-platform-text-secondary)]">
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
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">Email Provider</span>
                  <select
                    value={cfgDraft.emailProvider}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        emailProvider: e.target.value as NotificationChannelConfig['emailProvider'],
                      })
                    }
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  >
                    <option value="Gmail API">Gmail API (Workspace OAuth)</option>
                    <option value="SMTP">SMTP Relay</option>
                    <option value="Resend">Resend</option>
                    <option value="SendGrid">SendGrid</option>
                    <option value="Amazon SES">Amazon SES</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">Sender Email</span>
                  <input
                    type="email"
                    value={cfgDraft.senderEmail}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, senderEmail: e.target.value })}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  />
                </label>
              </div>

              {cfgDraft.emailProvider === 'Resend' && (
                <label className="block space-y-1">
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">Resend API Key (server-side only)</span>
                  <input
                    type="password"
                    value={resendKeyInput}
                    onChange={(e) => setResendKeyInput(e.target.value)}
                    placeholder="re_..."
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  />
                </label>
              )}

              {cfgDraft.emailProvider === 'SendGrid' && (
                <label className="block space-y-1">
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">SendGrid API Key (server-side only)</span>
                  <input
                    type="password"
                    value={sendgridKeyInput}
                    onChange={(e) => setSendgridKeyInput(e.target.value)}
                    placeholder="SG..."
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  />
                </label>
              )}

              <div className="space-y-2 pt-2 border-t border-[var(--aegion-platform-border)] text-xs text-[var(--aegion-platform-text-secondary)]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyAdminOnNewRegistration}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyAdminOnNewRegistration: e.target.checked })
                    }
                  />
                  <span>Send new registration &amp; contact alerts to Super Admin</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyUserOnReceived}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyUserOnReceived: e.target.checked })
                    }
                  />
                  <span>Send registration received confirmation to applicant</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cfgDraft.notifyUserOnApproval}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, notifyUserOnApproval: e.target.checked })
                    }
                  />
                  <span>Send approval &amp; single-use activation email to applicant</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  placeholder="Test recipient email"
                  className="flex-1 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-1.5 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => handleTestNotification('Email')}>
                  Test Email
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                  <MessageSquare className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
                  <span>WhatsApp Business Cloud API</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--aegion-platform-text-secondary)]">
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
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">WhatsApp Business Account ID</span>
                  <input
                    type="text"
                    value={cfgDraft.whatsappBusinessAccountId}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, whatsappBusinessAccountId: e.target.value })
                    }
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs font-mono text-[var(--aegion-platform-text)] aegion-btn-shape"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[var(--aegion-platform-text-muted)]">Phone Number ID</span>
                  <input
                    type="text"
                    value={cfgDraft.whatsappPhoneNumberId}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, whatsappPhoneNumberId: e.target.value })
                    }
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs font-mono text-[var(--aegion-platform-text)] aegion-btn-shape"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs text-[var(--aegion-platform-text-muted)]">
                  Cloud API Access Token ({cfgDraft.whatsappAccessTokenConfigured ? 'Configured on server' : 'Not set'})
                </span>
                <input
                  type="password"
                  value={waTokenInput}
                  onChange={(e) => setWaTokenInput(e.target.value)}
                  placeholder="Enter new permanent token to update"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-[var(--aegion-platform-text-muted)]">
                  Webhook Verify Token ({cfgDraft.whatsappWebhookVerifyTokenConfigured ? 'Configured' : 'Not set'})
                </span>
                <input
                  type="password"
                  value={waVerifyTokenInput}
                  onChange={(e) => setWaVerifyTokenInput(e.target.value)}
                  placeholder="Webhook verification secret"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
              </label>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="tel"
                  value={testWaPhone}
                  onChange={(e) => setTestWaPhone(e.target.value)}
                  placeholder="+14155550192"
                  className="flex-1 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-1.5 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
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
            <h3 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">Notification Delivery Logs</h3>
            <DataTable
              rows={overview.notificationLogs}
              rowKey={(n) => n.id}
              columns={[
                {
                  key: 'time',
                  header: 'Sent At',
                  render: (n) => (
                    <span className="text-xs tabular-nums text-[var(--aegion-platform-text-muted)]">
                      {new Date(n.sentTimestamp).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'channel',
                  header: 'Channel',
                  render: (n) => <span className="text-xs text-[var(--aegion-platform-text)]">{n.channel}</span>,
                },
                {
                  key: 'template',
                  header: 'Template',
                  render: (n) => <span className="text-xs text-[var(--aegion-platform-text-secondary)]">{n.template}</span>,
                },
                {
                  key: 'recipient',
                  header: 'Recipient',
                  render: (n) => <span className="text-xs text-[var(--aegion-platform-text-muted)]">{n.recipient}</span>,
                },
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
                          : 'text-[var(--aegion-platform-text-muted)]'
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

      {/* TAB: Platform Themes & Super Admin Governance */}
      {tab === 'themes' && <PlatformThemeGallery allowAdminGovernance />}

      {/* TAB 5: Users & Security */}
      {tab === 'security' && overview && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                Platform User Accounts
              </h2>
              <div className="text-xs text-[var(--aegion-platform-text-muted)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Server-enforced scrypt + RBAC</span>
              </div>
            </div>
            <DataTable
              rows={overview.users}
              rowKey={(u) => u.id}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (u) => <span className="text-[var(--aegion-platform-text)] font-medium">{u.name}</span>,
                },
                {
                  key: 'email',
                  header: 'Email',
                  render: (u) => <span className="text-[var(--aegion-platform-text-muted)]">{u.email}</span>,
                },
                {
                  key: 'role',
                  header: 'Role',
                  render: (u) => <span className="font-mono text-xs text-[var(--aegion-platform-accent)]">{u.role}</span>,
                },
                {
                  key: 'status',
                  header: 'Account Status',
                  render: (u) => <span className="text-xs text-[var(--aegion-platform-text)]">{u.status}</span>,
                },
                {
                  key: 'action',
                  header: 'Control',
                  align: 'right',
                  render: (u) =>
                    u.role === 'super_admin' ? (
                      <span className="text-[11px] text-[var(--aegion-platform-text-muted)]">Protected Admin</span>
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
            <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
              Security Audit Trail
            </h2>
            <DataTable
              rows={overview.auditLogs}
              rowKey={(a) => a.id}
              columns={[
                {
                  key: 'time',
                  header: 'Timestamp',
                  render: (a) => (
                    <span className="font-mono text-xs tabular-nums text-[var(--aegion-platform-text-muted)]">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'actor',
                  header: 'Actor',
                  render: (a) => <span className="text-xs text-[var(--aegion-platform-text)]">{a.actorEmail}</span>,
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (a) => (
                    <span className="font-mono text-xs text-[var(--aegion-platform-text-secondary)]">{a.action}</span>
                  ),
                },
                {
                  key: 'target',
                  header: 'Target',
                  render: (a) => <span className="text-xs text-[var(--aegion-platform-text-muted)]">{a.target}</span>,
                },
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

      {/* TAB 6: AI Models, Prompt Registry, Themes, Support Tickets */}
      {tab === 'platform' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                AI Model Configuration
              </h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Primary Orchestration Model
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    notify(`Updated active orchestration model to ${e.target.value}`, 'success');
                  }}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-sm text-[var(--aegion-platform-text)] aegion-btn-shape"
                >
                  <option value="gemini-4-hydrogen">gemini-4-hydrogen (Default Fast Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Low-Latency Drafts)</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => navigate('prompts')}>
                  Manage Prompt Registry ({prompts.length})
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setTab('themes')}>
                  Platform Theme Studio ({PLATFORM_THEMES.length})
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => navigate('themes')}>
                  Generated App Themes (50)
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                Execution Sandbox Policy
              </h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Container Runtime Target
                </span>
                <select
                  value={isolationMode}
                  onChange={(e) => {
                    setIsolationMode(e.target.value);
                    notify('Updated isolated runtime target', 'success');
                  }}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-sm text-[var(--aegion-platform-text)] aegion-btn-shape"
                >
                  <option value="docker-sandbox">Isolated Docker Container (Non-Root)</option>
                  <option value="cloud-run">Google Cloud Run Service</option>
                </select>
              </label>
            </GlassCard>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">Support Tickets</h2>
            <DataTable
              rows={overview.supportTickets}
              rowKey={(t) => t.id}
              columns={[
                {
                  key: 'id',
                  header: 'Ticket',
                  render: (t) => <span className="font-mono text-xs text-[var(--aegion-platform-accent)]">{t.id}</span>,
                },
                {
                  key: 'subject',
                  header: 'Subject',
                  render: (t) => (
                    <div>
                      <div className="text-[var(--aegion-platform-text)] font-medium">{t.subject}</div>
                      <div className="text-xs text-[var(--aegion-platform-text-muted)]">{t.userEmail}</div>
                    </div>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (t) => <span className="text-xs text-[var(--aegion-platform-text-secondary)]">{t.priority}</span>,
                },
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
                      className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2 py-1 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
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

      {/* Contact Inquiry Detail & Status Modal */}
      <Modal
        open={Boolean(detailContact)}
        onClose={() => setDetailContact(null)}
        title={detailContact ? `${detailContact.subject} (${detailContact.id})` : 'Contact Inquiry'}
        subtitle={
          detailContact
            ? `${detailContact.fullName} · ${detailContact.email} · ${detailContact.company}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        {detailContact && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)]">
              <div>
                <span className="text-[var(--aegion-platform-text-muted)]">Category:</span>{' '}
                <span className="text-[var(--aegion-platform-accent)] font-medium">{detailContact.category}</span>
              </div>
              <div>
                <span className="text-[var(--aegion-platform-text-muted)]">Submitted:</span>{' '}
                <span className="text-[var(--aegion-platform-text)]">
                  {new Date(detailContact.submittedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[var(--aegion-platform-text-muted)]">Email Delivery:</span>{' '}
                <span className="text-[var(--aegion-platform-text)]">{detailContact.emailNotificationStatus}</span>
              </div>
              <div>
                <span className="text-[var(--aegion-platform-text-muted)]">Response Date:</span>{' '}
                <span className="text-[var(--aegion-platform-text)]">
                  {detailContact.responseDate ? new Date(detailContact.responseDate).toLocaleString() : '—'}
                </span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[var(--aegion-platform-border)]">
                <div className="text-[var(--aegion-platform-text-muted)] mb-1">Inquiry Message</div>
                <div className="text-[var(--aegion-platform-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {detailContact.message}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="font-medium text-[var(--aegion-platform-text-secondary)]">Inquiry Status</span>
                <select
                  value={contactStatusDraft}
                  onChange={(e) => setContactStatusDraft(e.target.value as ContactInquiryStatus)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                >
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-medium text-[var(--aegion-platform-text-secondary)]">
                Admin Notes (Synced to Contact Sheet)
              </span>
              <textarea
                rows={3}
                value={contactNotesDraft}
                onChange={(e) => setContactNotesDraft(e.target.value)}
                placeholder="Add internal review notes, follow-up summary, or resolution details..."
                className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--aegion-platform-border)]">
              <Button type="button" variant="secondary" onClick={() => setDetailContact(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={savingContact}
                onClick={() => handleSaveContactDetail()}
              >
                {savingContact ? 'Saving...' : 'Save Changes'}
              </Button>
              {detailContact.status !== 'Resolved' && (
                <Button
                  type="button"
                  disabled={savingContact}
                  onClick={() => handleSaveContactDetail('Resolved')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)]">
              <div><span className="text-[var(--aegion-platform-text-muted)]">Phone:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.phone}</span></div>
              <div><span className="text-[var(--aegion-platform-text-muted)]">Country:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.country}</span></div>
              <div><span className="text-[var(--aegion-platform-text-muted)]">Job Title:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.jobTitle}</span></div>
              <div><span className="text-[var(--aegion-platform-text-muted)]">Apps:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.applicationTypes.join(', ')}</span></div>
              <div><span className="text-[var(--aegion-platform-text-muted)]">Backend / DB:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.preferredBackendLanguage} / {detailReg.preferredDatabase}</span></div>
              <div><span className="text-[var(--aegion-platform-text-muted)]">Theme Option:</span> <span className="text-[var(--aegion-platform-text)]">{detailReg.themeOption}</span></div>
              <div className="sm:col-span-2"><span className="text-[var(--aegion-platform-text-muted)]">Description:</span> <span className="text-[var(--aegion-platform-text-secondary)]">{detailReg.projectDescription}</span></div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[var(--aegion-platform-text)]">Approval History</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {overview.approvalHistory
                  .filter((h) => h.registrationId === detailReg.id)
                  .map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-lg bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono text-[var(--aegion-platform-accent)]">{h.action}</span> · {h.previousStatus} → {h.newStatus}
                        <div className="text-[var(--aegion-platform-text-muted)]">{h.comments}</div>
                      </div>
                      <span className="text-[var(--aegion-platform-text-muted)] tabular-nums shrink-0">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--aegion-platform-border)]">
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
                <span>Approve &amp; Issue Activation</span>
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
            <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
              Admin Notes / Reason (Logged to Audit &amp; Notifications)
            </span>
            <textarea
              rows={3}
              value={decisionComments}
              onChange={(e) => setDecisionComments(e.target.value)}
              placeholder="Enter approval remarks, requested clarifications, or rejection reason..."
              className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
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
        title="Confirm Dual Google Sheets Synchronization"
        subtitle="Update both AEGION_AI_CUSTOMER_REGISTRATIONS and AEGION_AI_CONTACT_INQUIRIES."
      >
        <div className="space-y-4 text-xs text-[var(--aegion-platform-text-muted)]">
          <p>
            This idempotently refreshes both Google Spreadsheets using the authoritative server database without duplicate records.
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
        <div className="space-y-4 text-xs text-[var(--aegion-platform-text-muted)]">
          <p>
            {suspendTarget?.next === 'suspended'
              ? 'Suspending this account immediately revokes active sessions and blocks workspace access.'
              : 'Reactivating restores workspace access for this approved user.'}
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
