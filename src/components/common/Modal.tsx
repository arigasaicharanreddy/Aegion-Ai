import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-2xl',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} border border-[var(--aegion-platform-border-strong)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{
          backgroundColor: 'var(--aegion-platform-surface-solid)',
          color: 'var(--aegion-platform-text)',
          borderRadius: 'var(--aegion-platform-radius)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[var(--aegion-platform-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--aegion-platform-text)] font-display">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
