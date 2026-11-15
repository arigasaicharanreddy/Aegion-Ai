import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Mail,
  Palette,
  RefreshCw,
  Shield,
  Sliders,
  Upload,
  User,
} from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { usePlatformTheme } from '../context/PlatformThemeContext';
import { apiClient, BackendHealthStatus } from '../services/apiClient';
import { exportPythonBackendScaffoldZip, exportProjectZip } from '../services/projectService';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { PreviewPanel } from '../components/layout/PreviewPanel';
import { SupportTicket } from '../types/project';
import type { PlatformAnimationMode } from '../types/auth';

export const DeploymentsPage: React.FC = () => {
  const { activeProject, runtimeMode, notify } = useAegion();
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleDownloadPython = async () => {
    await exportPythonBackendScaffoldZip();
    notify('Downloaded Python FastAPI + LangGraph + RAG backend scaffold ZIP', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
            Deployments &amp; Python Backend Service
          </h1>
          <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
            AI Studio serves the React frontend and Express SSE gateway with optional external FastAPI and notification providers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={loadHealth}>
            <RefreshCw className="w-3.5 h-3.5" />
            Check Gateway
          </Button>
          <Button type="button" size="sm" onClick={handleDownloadPython}>
            <Download className="w-3.5 h-3.5" />
            Download FastAPI Backend ZIP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
            Active Runtime Topology
          </h2>
          {loading ? (
            <p className="text-xs text-[var(--aegion-platform-text-muted)]">Checking gateway configuration...</p>
          ) : health ? (
            <div className="space-y-2 text-xs text-[var(--aegion-platform-text-secondary)]">
              <div className="flex justify-between py-1.5 border-b border-[var(--aegion-platform-border)]">
                <span className="text-[var(--aegion-platform-text-muted)]">Environment</span>
                <span className="font-mono text-emerald-400">
                  {runtimeMode.nodeEnv === 'production' ? 'Production' : 'Active Gateway'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--aegion-platform-border)]">
                <span className="text-[var(--aegion-platform-text-muted)]">Gateway Adapter</span>
                <span className="font-mono">{health.gatewayRuntime}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--aegion-platform-border)]">
                <span className="text-[var(--aegion-platform-text-muted)]">External Python FastAPI</span>
                <span className="font-mono">
                  {health.pythonBackendConfigured ? health.pythonBackendUrl : 'Not Configured (Gateway Active)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--aegion-platform-border)]">
                <span className="text-[var(--aegion-platform-text-muted)]">Server Gemini AI</span>
                <span className="font-mono">
                  {runtimeMode.geminiConfigured ? 'Configured (gemini-4-hydrogen)' : 'Not Configured'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--aegion-platform-text-muted)]">Email Notifications</span>
                <span className="font-mono">
                  {runtimeMode.emailConfigured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400">Gateway health check unavailable.</p>
          )}
        </GlassCard>

        <GlassCard className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
            Export {activeProject.name}
          </h2>
          <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
            Package the generated {activeProject.language} ({activeProject.framework}) source files,
            PostgreSQL schema definitions, decoupled CSS theme tokens, and Project Memory snapshot.
          </p>
          <div className="pt-2">
            <Button type="button" variant="secondary" onClick={() => exportProjectZip(activeProject)}>
              <Download className="w-4 h-4" />
              Export Project Bundle ({activeProject.version})
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export const UsagePage: React.FC = () => {
  const { projects, prompts, chatHistory } = useAegion();
  const totalMessages = Object.values(chatHistory).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">Workspace Usage</h1>
        <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
          Generation volume across projects, multi-language packs, and version snapshots.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Active Projects</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {projects.length}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Chat Turns</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {totalMessages}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Prompt Packs</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {prompts.length}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Generated Source Files</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {projects.reduce((sum, p) => sum + p.files.length, 0)}
          </div>
        </GlassCard>
      </div>

      <DataTable
        rows={projects}
        rowKey={(p) => p.id}
        columns={[
          {
            key: 'name',
            header: 'Project',
            render: (p) => <span className="text-[var(--aegion-platform-text)] font-medium">{p.name}</span>,
          },
          {
            key: 'lang',
            header: 'Target Stack',
            render: (p) => (
              <span className="text-xs text-[var(--aegion-platform-text-secondary)]">
                {p.language} / {p.framework}
              </span>
            ),
          },
          { key: 'versions', header: 'Versions', align: 'right', render: (p) => <span className="tabular-nums">{p.versions.length}</span> },
          { key: 'files', header: 'Files', align: 'right', render: (p) => <span className="tabular-nums">{p.files.length}</span> },
        ]}
      />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { workspace, updateWorkspace, user, setAuthenticatedUser, setPlatformCompactMode, navigate, notify } =
    useAegion();
  const {
    activeTheme,
    animationMode,
    isSavingTheme,
    updateMotionSettings,
    resetToDefault,
  } = usePlatformTheme();
  const isSuperAdmin = user?.role === 'super_admin';

  const [fullName, setFullName] = useState(user?.name || '');
  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName || workspace.name);
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [country, setCountry] = useState(user?.country || '');
  const [themePreference, setThemePreference] = useState<'dark' | 'light'>(
    user?.preferences?.themePreference || 'dark'
  );
  const [compactMode, setCompactMode] = useState<boolean>(Boolean(user?.preferences?.compactMode));
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(
    user?.preferences?.emailNotificationsEnabled ?? true
  );
  const [pythonUrl, setPythonUrl] = useState(workspace.pythonBackendUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Email change verification state
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeMessage, setEmailChangeMessage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setWorkspaceName(user.workspaceName || workspace.name);
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      setCompanyName(user.companyName || '');
      setJobTitle(user.jobTitle || '');
      setCountry(user.country || '');
      setThemePreference(user.preferences?.themePreference || 'dark');
      setCompactMode(Boolean(user.preferences?.compactMode));
      setEmailNotificationsEnabled(user.preferences?.emailNotificationsEnabled ?? true);
    }
  }, [user, workspace.name]);

  const passwordRules = useMemo(
    () => [
      { label: 'At least 12 characters', ok: newPassword.length >= 12 },
      { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(newPassword) },
      { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(newPassword) },
      { label: 'Number (0-9)', ok: /[0-9]/.test(newPassword) },
      { label: 'Special symbol (!@#$...)', ok: /[^A-Za-z0-9]/.test(newPassword) },
    ],
    [newPassword]
  );

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 900 * 1024) {
      setProfileError('Profile picture must be under 900 KB.');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setProfileError('Profile picture must be PNG, JPG, or WEBP.');
      return;
    }
    setProfileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const res = await apiClient.updateProfile({
        name: fullName,
        workspaceName,
        phone,
        avatarUrl,
        ...(isSuperAdmin
          ? {}
          : {
              companyName,
              jobTitle,
              country,
              preferences: {
                themePreference,
                compactMode,
                emailNotificationsEnabled,
              },
            }),
      });
      setAuthenticatedUser(res.user, 'settings');
      if (!isSuperAdmin) {
        setPlatformCompactMode(compactMode);
      }
      updateWorkspace({ name: workspaceName, pythonBackendUrl: pythonUrl });
      notify('Profile updated and saved.', 'success');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeError(null);
    setEmailChangeMessage(null);
    setRequestingEmailChange(true);
    try {
      const res = await apiClient.requestEmailChange(newEmailInput.trim(), emailChangePassword);
      setEmailChangeMessage(res.message);
      setNewEmailInput('');
      setEmailChangePassword('');
      const refreshed = await apiClient.getCurrentSession();
      if (refreshed.authenticated && refreshed.user) {
        setAuthenticatedUser(refreshed.user, 'settings');
      }
      notify('Verification email sent to confirm new login identity.', 'success');
    } catch (err) {
      setEmailChangeError(err instanceof Error ? err.message : 'Unable to request email change.');
    } finally {
      setRequestingEmailChange(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (passwordRules.some((r) => !r.ok)) {
      setPasswordError('Please satisfy all strong password requirements.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiClient.changePassword(currentPassword, newPassword);
      setAuthenticatedUser(res.user, 'settings');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify('Password updated securely and prior sessions revoked.', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
          {isSuperAdmin ? 'Super Admin Profile & Security' : 'User Profile & Account Settings'}
        </h1>
        <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
          {isSuperAdmin
            ? 'Manage your Super Admin identity, profile picture, platform theme preferences, verified email changes, and password security.'
            : 'Manage your personal profile, company details, platform appearance, email verification, and password.'}
        </p>
      </div>

      {/* Platform Theme & Motion Studio Quick Settings */}
      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--aegion-platform-border)]">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                Platform Theme &amp; Motion Studio
              </h2>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Active Platform Theme: <strong className="text-[var(--aegion-platform-text)]">{activeTheme.name}</strong> ({activeTheme.category} · {activeTheme.mode})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={isSavingTheme} onClick={() => void resetToDefault()}>
              Reset to Default
            </Button>
            <Button type="button" size="sm" onClick={() => navigate('themes')}>
              Open Theme Studio (10)
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[var(--aegion-platform-text-secondary)] mr-1">
              <Sliders className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
              Animation:
            </span>
            {(
              [
                ['full', 'Full'],
                ['balanced', 'Balanced'],
                ['minimal', 'Minimal'],
                ['disabled', 'Disabled'],
              ] as [PlatformAnimationMode, string][]
            ).map(([modeId, label]) => (
              <button
                key={modeId}
                type="button"
                disabled={isSavingTheme}
                onClick={() => void updateMotionSettings({ animationMode: modeId })}
                className={`px-2.5 py-1 border font-medium cursor-pointer aegion-btn-shape ${
                  animationMode === modeId
                    ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                    : 'bg-[var(--aegion-platform-bg-alt)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Profile Details */}
        <GlassCard className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--aegion-platform-border)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
              <User className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
              <span>{isSuperAdmin ? 'Super Admin Profile' : 'Personal & Company Profile'}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--aegion-platform-accent)]">
              <Shield className="w-3 h-3" />
              {isSuperAdmin ? 'Super Admin' : 'Active Workspace User'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Profile Picture Preview & Upload */}
            <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border border-[var(--aegion-platform-border-strong)] shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center text-sm font-bold text-[var(--aegion-platform-text)] shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-[200px] space-y-2">
                <div className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Profile Picture</div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--aegion-platform-surface-solid)] hover:bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] text-xs text-[var(--aegion-platform-text)] cursor-pointer aegion-btn-shape">
                    <Upload className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Full Name *</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Phone Number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 0192"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>
            </div>

            {!isSuperAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Company Name</span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Job Title</span>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Country</span>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                  />
                </label>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Workspace Name</span>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
              />
            </label>

            {!isSuperAdmin && (
              <div className="p-4 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-3">
                <div className="text-xs font-semibold text-[var(--aegion-platform-text)]">Profile Preferences</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="block space-y-1">
                    <span className="text-[var(--aegion-platform-text-muted)]">Preferred Theme Polarity</span>
                    <select
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value as 'dark' | 'light')}
                      className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                    </select>
                  </label>
                  <div className="flex flex-col justify-end gap-2 pb-1">
                    <label className="flex items-center gap-2 text-[var(--aegion-platform-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                      />
                      <span>Compact Workspace Density</span>
                    </label>
                    <label className="flex items-center gap-2 text-[var(--aegion-platform-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotificationsEnabled}
                        onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                      />
                      <span>Account Email Notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  External Orchestration Engine URL (Optional)
                </span>
                <input
                  type="url"
                  value={pythonUrl}
                  onChange={(e) => setPythonUrl(e.target.value)}
                  placeholder="https://engine.example.com"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] font-mono focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>
            )}

            {profileError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                {profileError}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* Right: Email Verification & Password Security */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--aegion-platform-border)] text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
              <Mail className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
              <span>Login Email Address</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] text-xs space-y-1">
              <div className="text-[var(--aegion-platform-text-muted)]">Current Login Identity</div>
              <div className="text-[var(--aegion-platform-text)] font-medium break-all">{user?.email || ''}</div>
              {user?.pendingEmail && (
                <div className="text-amber-400 pt-1">
                  Pending Verification: <span className="font-mono">{user.pendingEmail}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleRequestEmailChange} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">New Email Address</span>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="new-email@company.com"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Current Password (Verification)</span>
                <input
                  type="password"
                  required
                  value={emailChangePassword}
                  onChange={(e) => setEmailChangePassword(e.target.value)}
                  placeholder="Confirm current password"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              {emailChangeError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                  {emailChangeError}
                </div>
              )}

              {emailChangeMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
                  {emailChangeMessage}
                </div>
              )}

              <Button type="submit" variant="secondary" size="sm" className="w-full" disabled={requestingEmailChange}>
                {requestingEmailChange ? 'Sending Verification Link...' : 'Verify & Update Email'}
              </Button>
            </form>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--aegion-platform-border)] text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
              <KeyRound className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
              <span>Change Password</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Current Password</span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">New Password</span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong new password"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Confirm New Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </label>

              <div className="p-3 rounded-lg bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-1">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-[11px] ${
                      rule.ok ? 'text-emerald-400' : 'text-[var(--aegion-platform-text-muted)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                  {passwordError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={savingPassword}>
                <KeyRound className="w-3.5 h-3.5" />
                <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export const SupportPage: React.FC = () => {
  const { tickets, createTicket } = useAegion();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Architecture');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Standard');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createTicket({ subject, category, priority, message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">Contact Aegion Support</h1>
        <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
          Request custom language prompt packs, Cloud Run deployment guidance, or workspace assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Subject</span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of request"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-sm text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2.5 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="Code Generation">Code Generation</option>
                    <option value="Theme Engine">Theme Engine</option>
                    <option value="Deployment">Deployment</option>
                    <option value="Billing">Billing</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Priority</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2.5 py-2 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                  >
                    <option value="Standard">Standard</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Details</span>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Include project ID, target language, or error details..."
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-2 text-sm text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
              </label>

              <Button type="submit" className="w-full">
                Submit Support Ticket
              </Button>
            </form>
          </GlassCard>
        </div>

        <div className="lg:col-span-7">
          <DataTable
            rows={tickets}
            rowKey={(t) => t.id}
            columns={[
              {
                key: 'id',
                header: 'ID',
                render: (t) => <span className="font-mono text-xs text-[var(--aegion-platform-accent)]">{t.id}</span>,
              },
              {
                key: 'subject',
                header: 'Subject',
                render: (t) => (
                  <div>
                    <div className="text-[var(--aegion-platform-text)] font-medium text-xs">{t.subject}</div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">{t.category}</div>
                  </div>
                ),
              },
              { key: 'priority', header: 'Priority', render: (t) => <span className="text-xs">{t.priority}</span> },
              {
                key: 'status',
                header: 'Status',
                align: 'right',
                render: (t) => <span className="text-xs text-[var(--aegion-platform-text-secondary)]">{t.status}</span>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export const SharedPreviewPage: React.FC = () => {
  const { sharedProject, navigate } = useAegion();

  if (!sharedProject) {
    return (
      <div className="min-h-screen bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display">Preview Link Unavailable</h1>
        <p className="text-sm text-[var(--aegion-platform-text-muted)]">This read-only project preview is disabled or invalid.</p>
        <Button type="button" onClick={() => navigate('landing')}>
          Return to Aegion AI
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)]">
      <header className="h-14 px-6 border-b border-[var(--aegion-platform-border)] flex items-center justify-between">
        <div>
          <span className="font-bold font-display">{sharedProject.name}</span>
          <span className="text-xs text-[var(--aegion-platform-text-muted)] ml-3">
            Read-Only Shared Preview · {sharedProject.version}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            window.history.replaceState({}, '', window.location.pathname);
            navigate('landing');
          }}
        >
          Built with Aegion AI
        </Button>
      </header>
      <div className="flex-1 min-h-0">
        <PreviewPanel project={sharedProject} readOnly />
      </div>
    </div>
  );
};

