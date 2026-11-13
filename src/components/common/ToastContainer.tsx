import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useAegion } from '../../context/AegionContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAegion();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#16171E] border border-white/15 shadow-xl text-sm text-[#F3F4F6]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.tone === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.tone === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.tone === 'info' && <Info className="w-4 h-4 text-[#A78BFA] shrink-0" />}
            <span className="truncate">{toast.title}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-[#9CA3AF] hover:text-white p-1 cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
