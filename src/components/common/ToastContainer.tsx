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
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 border border-[var(--aegion-platform-border-strong)] shadow-xl text-sm text-[var(--aegion-platform-text)]"
          style={{
            backgroundColor: 'var(--aegion-platform-surface-solid)',
            borderRadius: 'var(--aegion-platform-radius)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.tone === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.tone === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            {toast.tone === 'info' && (
              <Info className="w-4 h-4 text-[var(--aegion-platform-accent)] shrink-0" />
            )}
            <span className="truncate">{toast.title}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] p-1 cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
