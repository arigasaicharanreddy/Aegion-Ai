import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { signInWithGooglePopup } from '../services/googleAuth';
import { Button } from '../components/common/Button';
import { ThemeAmbientBackdrop } from '../components/theme-3d/ThemeAmbientBackdrop';
import { QuickThemeSwitcher } from '../components/platform-themes/QuickThemeSwitcher';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'forgot-password' | 'reset-password' }> = ({
  initialMode = 'login',
}) => {
  const {
    navigate,
    setAuthenticatedUser,
    setPendingStatusInfo,
    setGooglePrefill,
    setAdminPortalEmailPrefill,
    resetToken,
    setResetToken,
    notify,
  } = useAegion();

  const [mode, setMode] = useState<'login' | 'forgot-password' | 'reset-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [manualResetToken, setManualResetToken] = useState(resetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockedStatus, setBlockedStatus] = useState<{
    status: string;
    message: string;
    isRejected: boolean;
  } | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (resetToken) {
      setManualResetToken(resetToken);
      setMode('reset-password');
    }
  }, [resetToken]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setBlockedStatus(null);
    setResetMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        const res = await apiClient.requestPasswordReset(email.trim());
        setResetMessage(res.message);
        notify('Password reset instructions sent if the account is active.', 'success');
      } else if (mode === 'reset-password') {
        if (newPassword !== confirmPassword) {
          setErrorMessage('New password and confirmation do not match.');
          setLoading(false);
          return;
        }
        if (passwordRules.some((r) => !r.ok)) {
          setErrorMessage('Please satisfy all strong password requirements.');
          setLoading(false);
          return;
        }
        await apiClient.resetUserPassword(manualResetToken.trim(), newPassword);
        window.history.replaceState({}, '', window.location.pathname);
        setResetToken(null);
        setNewPassword('');
        setConfirmPassword('');
        setMode('login');
        setResetMessage('Your password has been updated. Please sign in with your new password.');
        notify('Password reset completed.', 'success');
      } else {
        const res = await apiClient.builderLogin(email.trim(), password);
        setAuthenticatedUser(res.user, 'dashboard');
        notify(`Welcome back, ${res.user.name}`, 'success');
      }
    } catch (err) {
      const error = err as Error & {
        payload?: {
          useAdminPortal?: boolean;
          registrationStatus?: string;
          registrationId?: string;
          needsRegistration?: boolean;
        };
      };
      if (error.payload?.useAdminPortal) {
        setAdminPortalEmailPrefill(email.trim());
        notify('Super Admin accounts sign in through the dedicated Super Admin Portal.', 'info');
        navigate('admin-login');
        return;
      }
      if (error.payload?.registrationStatus) {
        const regStatus = error.payload.registrationStatus;
        setPendingStatusInfo({
          email,
          status: regStatus,
          registrationId: error.payload.registrationId,
        });
        setBlockedStatus({
          status: regStatus,
          message: error.message,
          isRejected: regStatus === 'Rejected' || regStatus === 'Suspended',
        });
      } else {
        setErrorMessage(error.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleContinue = async () => {
    setErrorMessage(null);
    setBlockedStatus(null);
    setGoogleLoading(true);
    try {
      const googleRes = await signInWithGooglePopup();
      const exchanged = await apiClient.googleAuthExchange(googleRes.idToken, 'builder');

      if (exchanged.status === 'authenticated' && exchanged.user) {
        setAuthenticatedUser(
          exchanged.user,
          exchanged.user.role === 'super_admin' ? 'admin' : 'dashboard'
        );
        notify(`Signed in with Google as ${exchanged.user.email}`, 'success');
      } else if (exchanged.status === 'pending_approval') {
        const regStatus = exchanged.registrationStatus || 'Pending Approval';
        setPendingStatusInfo({
          email: exchanged.email,
          fullName: exchanged.name,
          status: regStatus,
          registrationId: exchanged.registrationId,
          adminComments: exchanged.adminComments,
        });
        setBlockedStatus({
          status: regStatus,
          message:
            exchanged.message ||
            'Your Aegion AI workspace access request is currently under review. You will receive an email notification once your request has been approved.',
          isRejected: regStatus === 'Rejected' || regStatus === 'Suspended',
        });
      } else if (exchanged.status === 'needs_registration' && exchanged.profile) {
        setGooglePrefill(exchanged.profile);
        notify('Complete the 6-step registration request before signing in to your workspace.', 'info');
        navigate('register');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
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
              onClick={() => navigate('admin-login')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Portal</span>
            </button>
          </div>
        </div>

        <div className="aegion-glass p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
              {mode === 'login'
                ? 'Sign in to Aegion AI'
                : mode === 'forgot-password'
                ? 'Forgot password'
                : 'Set a new password'}
            </h1>
            <p className="text-xs text-[var(--aegion-platform-text-muted)]">
              {mode === 'forgot-password'
                ? 'Enter your activated workspace email to receive a single-use password reset link.'
                : mode === 'reset-password'
                ? 'Create a new strong password for your Aegion AI workspace account.'
                : 'Sign in with Google or your activated workspace email and password.'}
            </p>
          </div>

          {mode === 'login' && (
            <div className="p-3.5 aegion-btn-shape bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--aegion-platform-text)]">
                <UserPlus className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                <span>New Users: Request Workspace Access</span>
              </div>
              <p className="text-[11px] text-[var(--aegion-platform-text-secondary)] leading-relaxed">
                New users must click Request Workspace Access and complete the six-step registration.
                Workspace sign-in unlocks after Super Admin approval and account activation.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setGooglePrefill(null);
                    navigate('register');
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
                >
                  <span>Request Workspace Access</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('pending-approval')}
                  className="text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] underline cursor-pointer"
                >
                  Check Approval Status
                </button>
              </div>
            </div>
          )}

          {blockedStatus && (
            <div
              className={`p-4 aegion-btn-shape border text-xs space-y-3 ${
                blockedStatus.isRejected
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {blockedStatus.isRejected ? (
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-semibold">Access Status: {blockedStatus.status}</div>
                  <p className="leading-relaxed opacity-95">{blockedStatus.message}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('pending-approval')}
                  className="inline-flex items-center gap-1 font-medium underline cursor-pointer"
                >
                  <span>Check Approval Status</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                {blockedStatus.isRejected && (
                  <button
                    type="button"
                    onClick={() => navigate('landing')}
                    className="underline cursor-pointer"
                  >
                    Contact Aegion AI Support
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <>
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleContinue}
                className="w-full flex items-center justify-center gap-3 bg-white text-[#1F1F1F] hover:bg-[#F3F4F6] disabled:opacity-60 font-medium text-sm px-4 py-2.5 aegion-btn-shape border border-[#747775]/40 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{googleLoading ? 'Verifying with Google...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 text-[11px] text-[var(--aegion-platform-text-muted)]">
                <div className="flex-1 h-px bg-[var(--aegion-platform-border)]" />
                <span>or login with email and password</span>
                <div className="flex-1 h-px bg-[var(--aegion-platform-border)]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset-password' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                  Work Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
                />
              </label>
            )}

            {mode === 'login' && (
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
                    placeholder="Enter your password"
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
            )}

            {mode === 'reset-password' && (
              <>
                {!resetToken && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                      Reset Token
                    </span>
                    <input
                      type="text"
                      required
                      value={manualResetToken}
                      onChange={(e) => setManualResetToken(e.target.value)}
                      className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2 text-xs font-mono text-[var(--aegion-platform-text)]"
                    />
                  </label>
                )}

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">
                    New Password
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
              </>
            )}

            {errorMessage && (
              <div className="p-3 aegion-btn-shape bg-red-500/10 border border-red-500/25 text-xs text-red-500 dark:text-red-300 space-y-2">
                <div>{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => navigate('pending-approval')}
                  className="inline-flex items-center gap-1 underline cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  <span>Check Approval Status</span>
                </button>
              </div>
            )}

            {resetMessage && (
              <div className="p-3 aegion-btn-shape bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 dark:text-emerald-300">
                {resetMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {mode === 'reset-password' && <KeyRound className="w-4 h-4" />}
              <span>
                {loading
                  ? 'Verifying...'
                  : mode === 'login'
                  ? 'Login with Email and Password'
                  : mode === 'forgot-password'
                  ? 'Send Reset Link'
                  : 'Reset Password'}
              </span>
            </Button>
          </form>

          <div className="pt-4 border-t border-[var(--aegion-platform-border)] space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2 text-[var(--aegion-platform-text-muted)]">
              <button
                type="button"
                onClick={() => {
                  setGooglePrefill(null);
                  navigate('register');
                }}
                className="inline-flex items-center gap-1 text-[var(--aegion-platform-accent)] hover:underline font-medium cursor-pointer"
              >
                <span>Request Workspace Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setBlockedStatus(null);
                    setMode('forgot-password');
                  }}
                  className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
                >
                  Forgot Password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setBlockedStatus(null);
                    setMode('login');
                  }}
                  className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[var(--aegion-platform-text-muted)]">
              <button
                type="button"
                onClick={() => navigate('pending-approval')}
                className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
              >
                Check Approval Status
              </button>
              <button
                type="button"
                onClick={() => navigate('activate')}
                className="hover:text-[var(--aegion-platform-text)] cursor-pointer"
              >
                Account Activation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
