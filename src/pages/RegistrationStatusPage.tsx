import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, KeyRound, Mail, Search, XCircle } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { Button } from '../components/common/Button';
import { ThemeAmbientBackdrop } from '../components/theme-3d/ThemeAmbientBackdrop';
import { QuickThemeSwitcher } from '../components/platform-themes/QuickThemeSwitcher';

export const RegistrationStatusPage: React.FC<{
  mode?: 'status' | 'activate' | 'verify-email';
}> = ({ mode = 'status' }) => {
  const {
    navigate,
    pendingStatusInfo,
    setPendingStatusInfo,
    activationToken,
    verifyEmailToken,
    setVerifyEmailToken,
    setAuthenticatedUser,
    notify,
  } = useAegion();

  const [lookupInput, setLookupInput] = useState(
    pendingStatusInfo?.email || pendingStatusInfo?.registrationId || ''
  );
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [manualToken, setManualToken] = useState(activationToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const [emailVerifyTokenInput, setEmailVerifyTokenInput] = useState(verifyEmailToken || '');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyEmailError, setVerifyEmailError] = useState<string | null>(null);
  const [verifyEmailDone, setVerifyEmailDone] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'verify-email' || !verifyEmailToken || verifyEmailDone) return;
    let active = true;
    setVerifyingEmail(true);
    setVerifyEmailError(null);
    apiClient
      .verifyEmailChange(verifyEmailToken)
      .then((res) => {
        if (!active) return;
        window.history.replaceState({}, '', window.location.pathname);
        setVerifyEmailToken(null);
        setAuthenticatedUser(res.user, 'settings');
        setVerifyEmailDone(res.user.email);
        notify(`Verified login email updated to ${res.user.email}`, 'success');
      })
      .catch((err) => {
        if (!active) return;
        setVerifyEmailError(
          err instanceof Error ? err.message : 'Unable to verify new email address.'
        );
      })
      .finally(() => {
        if (active) setVerifyingEmail(false);
      });
    return () => {
      active = false;
    };
  }, [mode, verifyEmailToken, verifyEmailDone, setVerifyEmailToken, setAuthenticatedUser, notify]);

  const passwordRules = useMemo(
    () => [
      { label: 'At least 12 characters', ok: password.length >= 12 },
      { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
      { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
      { label: 'Digit (0-9)', ok: /[0-9]/.test(password) },
      { label: 'Special symbol', ok: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);
    try {
      const trimmed = lookupInput.trim();
      const res = await apiClient.checkRegistrationStatus(
        trimmed.includes('@') ? { email: trimmed } : { id: trimmed }
      );
      setPendingStatusInfo(res);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Unable to locate registration.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    if (password !== confirmPassword) {
      setActivationError('Passwords do not match.');
      return;
    }
    if (passwordRules.some((r) => !r.ok)) {
      setActivationError('Password does not satisfy security policy.');
      return;
    }
    setActivating(true);
    try {
      const res = await apiClient.activateAccount(manualToken, password);
      window.history.replaceState({}, '', window.location.pathname);
      setAuthenticatedUser(res.user, 'dashboard');
      notify('Account activated! Welcome to Aegion AI.', 'success');
    } catch (err) {
      setActivationError(err instanceof Error ? err.message : 'Activation failed.');
    } finally {
      setActivating(false);
    }
  };

  const handleManualEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyEmailError(null);
    setVerifyingEmail(true);
    try {
      const res = await apiClient.verifyEmailChange(emailVerifyTokenInput.trim());
      window.history.replaceState({}, '', window.location.pathname);
      setVerifyEmailToken(null);
      setVerifyEmailDone(res.user.email);
      setAuthenticatedUser(res.user, 'settings');
      notify(`Email updated to ${res.user.email}`, 'success');
    } catch (err) {
      setVerifyEmailError(err instanceof Error ? err.message : 'Email verification failed.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  if (mode === 'verify-email') {
    return (
      <div className="relative min-h-screen bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] flex flex-col justify-center items-center p-6">
        <ThemeAmbientBackdrop variant="public" />
        <div className="relative z-10 w-full max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <QuickThemeSwitcher compact />
          </div>

          <div className="aegion-glass p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--aegion-platform-accent)]">
                <Mail className="w-4 h-4" />
                <span>Email Identity Verification</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
                Verify New Email Address
              </h1>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Confirming your single-use verification link updates your Aegion AI login identity.
              </p>
            </div>

            {verifyingEmail && (
              <div className="p-4 aegion-btn-shape bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] text-xs text-[var(--aegion-platform-text-secondary)]">
                Verifying your email confirmation link...
              </div>
            )}

            {verifyEmailDone && (
              <div className="p-4 aegion-btn-shape bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 dark:text-emerald-300">
                Email verified and updated to{' '}
                <span className="font-semibold">{verifyEmailDone}</span>.
              </div>
            )}

            {verifyEmailError && (
              <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300">
                {verifyEmailError}
              </div>
            )}

            {!verifyEmailToken && !verifyEmailDone && (
              <form onSubmit={handleManualEmailVerify} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    Verification Token
                  </span>
                  <input
                    type="text"
                    required
                    value={emailVerifyTokenInput}
                    onChange={(e) => setEmailVerifyTokenInput(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-xs font-mono text-[var(--aegion-platform-text)]"
                  />
                </label>
                <Button type="submit" className="w-full" disabled={verifyingEmail}>
                  {verifyingEmail ? 'Verifying...' : 'Confirm New Email'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'activate') {
    return (
      <div className="relative min-h-screen bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] flex flex-col justify-center items-center p-6">
        <ThemeAmbientBackdrop variant="public" />
        <div className="relative z-10 w-full max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <QuickThemeSwitcher compact />
          </div>

          <div className="aegion-glass p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Registration Approved</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
                Activate Workspace Account
              </h1>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Create your permanent password to consume this single-use activation link and unlock your Aegion AI workspace.
              </p>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              {!activationToken && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    Activation Token
                  </span>
                  <input
                    type="text"
                    required
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-xs font-mono text-[var(--aegion-platform-text)]"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Create Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Confirm Password
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              <div className="p-3 aegion-btn-shape bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-1">
                {passwordRules.map((r) => (
                  <div
                    key={r.label}
                    className={`flex items-center gap-2 text-xs ${
                      r.ok ? 'text-emerald-500' : 'text-[var(--aegion-platform-text-muted)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>

              {activationError && (
                <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300">
                  {activationError}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={activating}>
                <KeyRound className="w-4 h-4" />
                <span>{activating ? 'Activating Account...' : 'Activate & Open Workspace'}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = pendingStatusInfo?.status || 'Pending Approval';
  const isRejected = currentStatus === 'Rejected' || currentStatus === 'Suspended';
  const isActive = currentStatus === 'Active';
  const isApprovedAwaiting =
    currentStatus === 'Approved — Awaiting Activation' || currentStatus === 'Approved';

  return (
    <div className="relative min-h-screen bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] flex flex-col justify-center items-center p-6">
      <ThemeAmbientBackdrop variant="public" />

      <div className="relative z-10 w-full max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Aegion AI</span>
          </button>
          <div className="flex items-center gap-3">
            <QuickThemeSwitcher compact />
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-xs text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="aegion-glass p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            {isRejected ? (
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            ) : isActive || isApprovedAwaiting ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 text-[var(--aegion-platform-accent)] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
                {pendingStatusInfo?.registrationId
                  ? `Status: ${currentStatus}`
                  : 'Check Approval Status'}
              </h1>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Workspace access is granted only after Super Admin review, approval, and single-use account activation.
              </p>
            </div>
          </div>

          {pendingStatusInfo?.registrationId && (
            <div className="p-4 aegion-btn-shape bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--aegion-platform-text-muted)]">Registration ID</span>
                <span className="font-mono text-[var(--aegion-platform-text)]">
                  {pendingStatusInfo.registrationId}
                </span>
              </div>
              {pendingStatusInfo.projectName && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--aegion-platform-text-muted)]">Project</span>
                  <span className="text-[var(--aegion-platform-text)] font-medium">
                    {pendingStatusInfo.projectName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--aegion-platform-text-muted)]">Current Status</span>
                <span
                  className={`font-semibold ${
                    isRejected
                      ? 'text-red-500'
                      : isActive || isApprovedAwaiting
                      ? 'text-emerald-500'
                      : 'text-[var(--aegion-platform-accent)]'
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
              {pendingStatusInfo.adminComments && (
                <div className="pt-2 border-t border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)]">
                  Admin Note: {pendingStatusInfo.adminComments}
                </div>
              )}
            </div>
          )}

          {/* Approval Workflow Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {[
              { label: 'Submitted', done: true },
              { label: 'Super Admin Review', done: currentStatus !== 'Pending Approval' },
              { label: 'Approved', done: !isRejected && (isApprovedAwaiting || isActive) },
              { label: 'Active Account', done: isActive },
            ].map((stage, i) => (
              <div
                key={stage.label}
                className={`p-2.5 aegion-btn-shape border ${
                  stage.done
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500'
                    : 'border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] text-[var(--aegion-platform-text-muted)]'
                }`}
              >
                <div className="font-mono text-[10px]">0{i + 1}</div>
                <div className="font-medium truncate">{stage.label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleLookup} className="space-y-3 pt-2 border-t border-[var(--aegion-platform-border)]">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                Look up status by Email or Registration ID
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="name@company.com or REG-2026-1002"
                  className="flex-1 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
                <Button type="submit" variant="secondary" disabled={lookupLoading}>
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? 'Checking...' : 'Check'}</span>
                </Button>
              </div>
            </label>
            {lookupError && <div className="text-xs text-red-500">{lookupError}</div>}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[var(--aegion-platform-text-muted)]">
            <button
              type="button"
              onClick={() => navigate('register')}
              className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
            >
              Submit workspace registration request
            </button>
            <button
              type="button"
              onClick={() => navigate('activate')}
              className="text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
            >
              Have an activation link token? Activate account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
