import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { Button } from '../components/common/Button';
import { ThemeAmbientBackdrop } from '../components/theme-3d/ThemeAmbientBackdrop';
import { QuickThemeSwitcher } from '../components/platform-themes/QuickThemeSwitcher';

type AdminAuthMode = 'login' | 'rotate' | 'forgot' | 'reset';

export const AdminAuthPage: React.FC = () => {
  const {
    user,
    authInitialized,
    navigate,
    setAuthenticatedUser,
    adminPortalEmailPrefill,
    setAdminPortalEmailPrefill,
    adminResetToken,
    setAdminResetToken,
    notify,
  } = useAegion();

  const [mode, setMode] = useState<AdminAuthMode>(() => {
    if (adminResetToken) return 'reset';
    if (user?.role === 'super_admin' && user?.mustChangePassword) return 'rotate';
    return 'login';
  });

  const [email, setEmail] = useState(() => adminPortalEmailPrefill || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);

  const [initialPasswordForRotate, setInitialPasswordForRotate] = useState('');
  const [recoveryTokenInput, setRecoveryTokenInput] = useState(adminResetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(() =>
    adminPortalEmailPrefill
      ? 'Super Admin accounts sign in through this dedicated portal. Enter your Super Admin password to continue.'
      : null
  );

  useEffect(() => {
    if (adminPortalEmailPrefill) {
      setEmail(adminPortalEmailPrefill);
      setAdminPortalEmailPrefill(null);
    }
  }, [adminPortalEmailPrefill, setAdminPortalEmailPrefill]);

  useEffect(() => {
    if (adminResetToken) {
      setRecoveryTokenInput(adminResetToken);
      setMode('reset');
    }
  }, [adminResetToken]);

  useEffect(() => {
    if (authInitialized && user?.role === 'super_admin' && !user.mustChangePassword && mode === 'login') {
      navigate('admin');
    }
  }, [authInitialized, user, mode, navigate]);

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.adminLogin(email.trim(), password, mfaCode || undefined);
      if (res.mustChangePassword) {
        setInitialPasswordForRotate(password);
        setPassword('');
        setAuthenticatedUser(res.user, 'admin-login');
        setMode('rotate');
        notify('Initial login verified. Set a permanent strong password or continue after updating.', 'info');
      } else {
        setAuthenticatedUser(res.user, 'admin');
        notify('Super Admin session verified', 'success');
      }
    } catch (err) {
      const error = err as Error & { status?: number; payload?: { mfaRequired?: boolean } };
      if (error.payload?.mfaRequired) {
        setMfaRequired(true);
      }
      if (error.status === 404) {
        setErrorMessage('Super Admin authentication endpoint is unavailable (404). Verify the server is running.');
      } else {
        setErrorMessage(error.message || 'Super Admin authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRotatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (passwordRules.some((r) => !r.ok)) {
      setErrorMessage('Please satisfy all strong password requirements.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.adminChangePassword(initialPasswordForRotate, newPassword);
      setAuthenticatedUser(res.user, 'admin');
      notify('Super Admin password updated and prior sessions revoked.', 'success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.adminForgotPassword(email.trim());
      setInfoMessage(res.message);
      notify('Recovery request processed', res.emailConfigured ? 'success' : 'info');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Recovery request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (passwordRules.some((r) => !r.ok)) {
      setErrorMessage('Please satisfy all strong password requirements.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.adminResetPassword(recoveryTokenInput.trim(), newPassword);
      window.history.replaceState({}, '', window.location.pathname);
      setAdminResetToken(null);
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
      setInfoMessage('Super Admin password reset completed. Sign in with your new password.');
      notify('Super Admin password reset completed', 'success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Recovery token validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--aegion-platform-bg)] text-[var(--aegion-platform-text)] flex flex-col justify-center items-center p-6 transition-colors duration-300">
      <ThemeAmbientBackdrop variant="public" />

      <div className="relative z-10 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Aegion AI</span>
          </button>
          <div className="flex items-center gap-2">
            <QuickThemeSwitcher compact />
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
            >
              Workspace Sign In
            </button>
          </div>
        </div>

        <div className="aegion-glass p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--aegion-platform-accent)]">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Control Plane</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
              {mode === 'rotate'
                ? 'Set Permanent Admin Password'
                : mode === 'forgot'
                ? 'Super Admin Password Recovery'
                : mode === 'reset'
                ? 'Complete Admin Recovery'
                : 'Super Admin Portal'}
            </h1>
            <p className="text-xs text-[var(--aegion-platform-text-muted)]">
              {mode === 'rotate'
                ? 'Set a permanent strong password for your Super Admin identity before entering the control plane.'
                : mode === 'forgot'
                ? 'Request a single-use 15-minute Super Admin recovery link.'
                : mode === 'reset'
                ? 'Provide your single-use recovery token and establish a new permanent Super Admin password.'
                : 'Authenticate with your Super Admin email and password to manage approvals, contact inquiries, and exports.'}
            </p>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Super Admin Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter authorized Super Admin email"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Super Admin password"
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape pl-3.5 pr-10 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              {mfaRequired && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    MFA Verification Code
                  </span>
                  <input
                    type="text"
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="6-digit verification code"
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] font-mono focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                  />
                </label>
              )}

              {errorMessage && (
                <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div className="p-3 aegion-btn-shape bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 dark:text-emerald-300">
                  {infoMessage}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Authenticate Super Admin'}
              </Button>

              <div className="pt-2 flex items-center justify-between text-xs text-[var(--aegion-platform-text-muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setInfoMessage(null);
                    setMode('forgot');
                  }}
                  className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
                >
                  Forgot Super Admin Password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('reset');
                  }}
                  className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
                >
                  Have a recovery token?
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Super Admin Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter authorized Super Admin email"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              {errorMessage && (
                <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300">
                  {errorMessage}
                </div>
              )}
              {infoMessage && (
                <div className="p-3 aegion-btn-shape bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 dark:text-emerald-300 leading-relaxed">
                  {infoMessage}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Processing...' : 'Request Recovery Procedure'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('login');
                }}
                className="text-xs text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
              >
                Back to Super Admin Login
              </button>
            </form>
          )}

          {(mode === 'rotate' || mode === 'reset') && (
            <form
              onSubmit={mode === 'rotate' ? handleRotatePassword : handleResetSubmit}
              className="space-y-4"
            >
              {mode === 'rotate' && !initialPasswordForRotate && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    Current Initial Password
                  </span>
                  <input
                    type="password"
                    required
                    value={initialPasswordForRotate}
                    onChange={(e) => setInitialPasswordForRotate(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                  />
                </label>
              )}

              {mode === 'reset' && !adminResetToken && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    Recovery Token
                  </span>
                  <input
                    type="text"
                    required
                    value={recoveryTokenInput}
                    onChange={(e) => setRecoveryTokenInput(e.target.value)}
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-xs font-mono text-[var(--aegion-platform-text)]"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  New Permanent Password
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Confirm New Password
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>

              <div className="p-3 aegion-btn-shape bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] space-y-1.5">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${
                      rule.ok ? 'text-emerald-500' : 'text-[var(--aegion-platform-text-muted)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <KeyRound className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Updating...'
                    : mode === 'rotate'
                    ? 'Save Password & Enter Admin Console'
                    : 'Reset Password'}
                </span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
