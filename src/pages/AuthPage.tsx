import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { signInWithGooglePopup } from '../services/googleAuth';
import { Button } from '../components/common/Button';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'forgot-password' }> = ({
  initialMode = 'login',
}) => {
  const {
    navigate,
    setAuthenticatedUser,
    setPendingStatusInfo,
    setGooglePrefill,
    runtimeMode,
    enterFreeDevPreview,
    notify,
  } = useAegion();

  const [mode, setMode] = useState<'login' | 'forgot-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        const res = await apiClient.requestPasswordReset(email);
        setResetMessage(res.message);
        notify('Password reset instructions queued', 'success');
      } else {
        const res = await apiClient.builderLogin(email, password);
        setAuthenticatedUser(res.user, 'dashboard');
        notify(`Welcome back, ${res.user.name}`, 'success');
      }
    } catch (err) {
      const error = err as Error & { payload?: { useAdminPortal?: boolean; registrationStatus?: string; registrationId?: string } };
      if (error.payload?.useAdminPortal) {
        notify('Super Admin accounts sign in through the dedicated Admin Portal.', 'info');
        navigate('admin-login');
        return;
      }
      if (error.payload?.registrationStatus) {
        setPendingStatusInfo({
          email,
          status: error.payload.registrationStatus,
          registrationId: error.payload.registrationId,
        });
      }
      setErrorMessage(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleContinue = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const googleRes = await signInWithGooglePopup();
      const exchanged = await apiClient.googleAuthExchange(googleRes.idToken, 'builder');

      if (exchanged.status === 'authenticated' && exchanged.user) {
        setAuthenticatedUser(exchanged.user, exchanged.user.role === 'super_admin' ? 'admin' : 'dashboard');
        notify(`Signed in with Google as ${exchanged.user.email}`, 'success');
      } else if (exchanged.status === 'pending_approval') {
        setPendingStatusInfo({
          email: exchanged.email,
          fullName: exchanged.name,
          status: exchanged.registrationStatus || 'Pending Approval',
          registrationId: exchanged.registrationId,
          adminComments: exchanged.adminComments,
        });
        navigate('pending-approval');
      } else if (exchanged.status === 'needs_registration' && exchanged.profile) {
        setGooglePrefill(exchanged.profile);
        notify('Google verified. Complete your project registration for Super Admin approval.', 'info');
        navigate('register');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090C] text-[#F3F4F6] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Aegion AI</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('admin-login')}
            className="inline-flex items-center gap-1.5 text-xs text-[#A78BFA] hover:text-white cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Portal</span>
          </button>
        </div>

        <div className="aegion-glass rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white font-display">
              {mode === 'login' ? 'Sign in to Aegion AI' : 'Reset workspace password'}
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              {mode === 'forgot-password'
                ? 'Enter your approved workspace email to receive a single-use reset link.'
                : 'Approved builder accounts can access the multi-language AI Studio and project memory.'}
            </p>
          </div>

          {mode === 'login' && (
            <>
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleContinue}
                className="w-full flex items-center justify-center gap-3 bg-white text-[#1F1F1F] hover:bg-[#F3F4F6] disabled:opacity-60 font-medium text-sm px-4 py-2.5 rounded-lg border border-[#747775]/40 transition-colors cursor-pointer"
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

              <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                <div className="flex-1 h-px bg-white/10" />
                <span>or sign in with approved credentials</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#D1D5DB]">Work Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
              />
            </label>

            {mode !== 'forgot-password' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your activated password"
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 space-y-2">
                <div>{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => navigate('pending-approval')}
                  className="inline-flex items-center gap-1 text-white underline cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  <span>Check registration approval status</span>
                </button>
              </div>
            )}

            {resetMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
                {resetMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? 'Verifying...'
                : mode === 'login'
                ? 'Sign In to Workspace'
                : 'Send Reset Link'}
            </Button>
          </form>

          {mode === 'login' && runtimeMode.freeDevMode && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => enterFreeDevPreview('builder', 'dashboard')}
            >
              Continue in Free Dev Mode (Builder Preview)
            </Button>
          )}

          <div className="pt-4 border-t border-white/10 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2 text-[#9CA3AF]">
              <button
                type="button"
                onClick={() => {
                  setGooglePrefill(null);
                  navigate('register');
                }}
                className="inline-flex items-center gap-1 text-[#A78BFA] hover:text-white font-medium cursor-pointer"
              >
                <span>New organization? Request Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {mode !== 'forgot-password' ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('forgot-password');
                  }}
                  className="hover:text-white cursor-pointer"
                >
                  Forgot password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="hover:text-white cursor-pointer"
                >
                  Back to sign in
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[#6B7280]">
              <button
                type="button"
                onClick={() => navigate('pending-approval')}
                className="hover:text-[#D1D5DB] cursor-pointer"
              >
                Track pending registration status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
