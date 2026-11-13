import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, KeyRound, Search, XCircle } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient } from '../services/apiClient';
import { Button } from '../components/common/Button';

export const RegistrationStatusPage: React.FC<{ mode?: 'status' | 'activate' }> = ({
  mode = 'status',
}) => {
  const {
    navigate,
    pendingStatusInfo,
    setPendingStatusInfo,
    activationToken,
    setAuthenticatedUser,
    notify,
  } = useAegion();

  const [lookupInput, setLookupInput] = useState(pendingStatusInfo?.email || pendingStatusInfo?.registrationId || '');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [manualToken, setManualToken] = useState(activationToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

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
      notify('Account activated! Welcome to Aegion AI Builder.', 'success');
    } catch (err) {
      setActivationError(err instanceof Error ? err.message : 'Activation failed.');
    } finally {
      setActivating(false);
    }
  };

  if (mode === 'activate') {
    return (
      <div className="min-h-screen bg-[#09090C] text-[#F3F4F6] flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md space-y-5">
          <button
            type="button"
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>

          <div className="aegion-glass rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Registration Approved</span>
              </div>
              <h1 className="text-2xl font-bold text-white font-display">Activate Builder Account</h1>
              <p className="text-xs text-[#9CA3AF]">
                Create your permanent password to consume this single-use activation link and unlock the Application Builder.
              </p>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              {!activationToken && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Activation Token</span>
                  <input
                    type="text"
                    required
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-xs font-mono text-white"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Create Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Confirm Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <div className="p-3 rounded-lg bg-[#14151C] border border-white/10 space-y-1">
                {passwordRules.map((r) => (
                  <div
                    key={r.label}
                    className={`flex items-center gap-2 text-xs ${
                      r.ok ? 'text-emerald-400' : 'text-[#9CA3AF]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>

              {activationError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                  {activationError}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={activating}>
                <KeyRound className="w-4 h-4" />
                <span>{activating ? 'Activating Account...' : 'Activate & Open Builder'}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = pendingStatusInfo?.status || 'Pending Approval';
  const isRejected = currentStatus === 'Rejected' || currentStatus === 'Suspended';
  const isApproved = currentStatus === 'Approved';

  return (
    <div className="min-h-screen bg-[#09090C] text-[#F3F4F6] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl space-y-5">
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
            className="text-xs text-[#A78BFA] hover:text-white cursor-pointer"
          >
            Sign In
          </button>
        </div>

        <div className="aegion-glass rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            {isRejected ? (
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            ) : isApproved ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 text-[#A78BFA] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white font-display">
                {pendingStatusInfo?.registrationId
                  ? `Registration Status: ${currentStatus}`
                  : 'Check Registration Status'}
              </h1>
              <p className="text-xs text-[#9CA3AF]">
                Application Builder access is unlocked once the Super Admin approves your registration and you complete account activation.
              </p>
            </div>
          </div>

          {pendingStatusInfo?.registrationId && (
            <div className="p-4 rounded-xl bg-[#14151C] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Registration ID</span>
                <span className="font-mono text-white">{pendingStatusInfo.registrationId}</span>
              </div>
              {pendingStatusInfo.projectName && (
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Project</span>
                  <span className="text-white font-medium">{pendingStatusInfo.projectName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Current Status</span>
                <span className="font-semibold text-[#A78BFA]">{currentStatus}</span>
              </div>
              {pendingStatusInfo.adminComments && (
                <div className="pt-2 border-t border-white/10 text-[#D1D5DB]">
                  Admin Note: {pendingStatusInfo.adminComments}
                </div>
              )}
            </div>
          )}

          {/* Approval Workflow Timeline */}
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            {[
              { label: 'Submitted', done: true },
              { label: 'Admin Review', done: currentStatus !== 'Pending Approval' },
              { label: 'Approved', done: isApproved },
              { label: 'Builder Access', done: false },
            ].map((stage, i) => (
              <div
                key={stage.label}
                className={`p-2.5 rounded-lg border ${
                  stage.done
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-[#14151C] text-[#9CA3AF]'
                }`}
              >
                <div className="font-mono text-[10px]">0{i + 1}</div>
                <div className="font-medium truncate">{stage.label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleLookup} className="space-y-3 pt-2 border-t border-white/10">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#D1D5DB]">
                Look up status by Email or Registration ID
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="rohan@medipulse.health or REG-2026-1002"
                  className="flex-1 bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
                <Button type="submit" variant="secondary" disabled={lookupLoading}>
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? 'Checking...' : 'Check'}</span>
                </Button>
              </div>
            </label>
            {lookupError && <div className="text-xs text-red-400">{lookupError}</div>}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#9CA3AF]">
            <button type="button" onClick={() => navigate('register')} className="hover:text-white cursor-pointer">
              Submit another registration
            </button>
            <button type="button" onClick={() => navigate('activate')} className="text-[#A78BFA] hover:text-white cursor-pointer">
              Have an activation token? Activate account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
