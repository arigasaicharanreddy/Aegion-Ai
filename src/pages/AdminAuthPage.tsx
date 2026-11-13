import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { Button } from '../components/common/Button';

export const AdminAuthPage: React.FC = () => {
  const { user, navigate, setAuthenticatedUser, runtimeMode, enterFreeDevPreview, notify } = useAegion();

  const [email, setEmail] = useState('arigasaicharan@gmail.com');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);

  const [mustRotate, setMustRotate] = useState(() => Boolean(user?.role === 'super_admin' && user?.mustChangePassword));
  const [initialPasswordForRotate, setInitialPasswordForRotate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const res = await apiClient.adminLogin(email, password, mfaCode || undefined);
      if (res.mustChangePassword) {
        setInitialPasswordForRotate(password);
        setPassword('');
        setAuthenticatedUser(res.user, 'admin-login');
        setMustRotate(true);
        notify('Initial bootstrap login verified. Set your permanent strong password to continue.', 'info');
      } else {
        setAuthenticatedUser(res.user, 'admin');
        notify('Super Admin session verified', 'success');
      }
    } catch (err) {
      const error = err as Error & { payload?: { mfaRequired?: boolean } };
      if (error.payload?.mfaRequired) {
        setMfaRequired(true);
      }
      setErrorMessage(error.message || 'Super Admin authentication failed.');
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
      setErrorMessage(err instanceof Error ? err.message : 'Password rotation failed.');
    } finally {
      setLoading(false);
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
            onClick={() => navigate('login')}
            className="text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            Builder Sign In
          </button>
        </div>

        <div className="aegion-glass rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#A78BFA]">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Control Plane</span>
            </div>
            <h1 className="text-2xl font-bold text-white font-display">
              {mustRotate ? 'Rotate Super Admin Password' : 'Super Admin Portal'}
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              {mustRotate
                ? 'Security policy requires replacing the initial bootstrap password immediately. The initial password will be invalidated.'
                : 'Authenticate with the provisioned Super Admin credentials to manage approvals, exports, and automation.'}
            </p>
          </div>

          {!mustRotate ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Super Admin Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter bootstrap or permanent password"
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              {mfaRequired && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">MFA Verification Code</span>
                  <input
                    type="text"
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="6-digit verification code"
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Authenticate Super Admin'}
              </Button>

              {runtimeMode.freeDevMode && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => enterFreeDevPreview('super_admin', 'admin')}
                  >
                    Enter Free Dev Admin Preview (No Secret Required)
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRotatePassword} className="space-y-4">
              {!initialPasswordForRotate && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Current Initial Password</span>
                  <input
                    type="password"
                    required
                    value={initialPasswordForRotate}
                    onChange={(e) => setInitialPasswordForRotate(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">New Permanent Password</span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Confirm New Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <div className="p-3 rounded-lg bg-[#14151D] border border-white/10 space-y-1.5">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${
                      rule.ok ? 'text-emerald-400' : 'text-[#9CA3AF]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Updating Password...' : 'Save Password & Enter Admin Console'}</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
