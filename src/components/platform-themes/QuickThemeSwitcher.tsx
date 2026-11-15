import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Eye, Palette, Sparkles, X } from 'lucide-react';
import { usePlatformTheme } from '../../context/PlatformThemeContext';
import { getPlatformThemeById, PLATFORM_THEMES } from '../../platform-themes/catalog';
import { useAegion } from '../../context/AegionContext';

export const QuickThemeSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, navigate } = useAegion();
  const {
    activeTheme,
    persistedThemeId,
    previewThemeId,
    isPreviewing,
    isSavingTheme,
    applyTheme,
    startPreview,
    cancelPreview,
    isThemeDisabledForCurrentUser,
  } = usePlatformTheme();
  const [open, setOpen] = useState(false);

  const availableThemes = PLATFORM_THEMES.filter((t) => !isThemeDisabledForCurrentUser(t.id));

  const handleClose = () => {
    if (isPreviewing) {
      cancelPreview();
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const targetPreviewTheme = previewThemeId ? getPlatformThemeById(previewThemeId) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
        title={`Platform Theme: ${activeTheme.name}`}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] text-[var(--aegion-platform-text)] transition-colors cursor-pointer aegion-btn-shape"
      >
        <span
          className="w-3 h-3 rounded-full border border-[var(--aegion-platform-border-strong)] shrink-0"
          style={{ backgroundColor: activeTheme.palette.accent }}
        />
        {!compact && (
          <span className="hidden xl:inline max-w-[132px] truncate">{activeTheme.name}</span>
        )}
        <Palette className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none sm:static sm:inset-auto flex items-start justify-center sm:block px-3 pt-16 sm:p-0"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-label="Platform Theme Selector"
            onClick={(e) => e.stopPropagation()}
            className="sm:absolute sm:right-0 sm:mt-2 w-full max-w-[540px] sm:w-[520px] max-h-[80vh] flex flex-col border border-[var(--aegion-platform-border-strong)] shadow-2xl z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--aegion-platform-surface-solid)',
              borderRadius: 'var(--aegion-platform-radius)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--aegion-platform-border)] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-[var(--aegion-platform-accent)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--aegion-platform-text)] truncate font-display">
                    Platform Themes ({availableThemes.length})
                  </div>
                  <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">
                    Select any theme to preview live, then apply across Aegion AI.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer shrink-0"
                aria-label="Close theme selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Miniature Visual Preview Grid (All 10 Distinct Themes) */}
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto flex-1 min-h-0">
              {availableThemes.map((t) => {
                const isPersisted = persistedThemeId === t.id;
                const isPreviewSelected = previewThemeId === t.id;
                const highlighted = isPreviewSelected || (!isPreviewing && isPersisted);

                return (
                  <div
                    key={t.id}
                    onClick={() => startPreview(t.id)}
                    onDoubleClick={() => {
                      void applyTheme(t.id);
                      setOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        startPreview(t.id);
                      }
                    }}
                    className={`group p-2.5 border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                      highlighted
                        ? 'border-[var(--aegion-platform-accent)] ring-1 ring-[var(--aegion-platform-accent)] bg-[var(--aegion-platform-accent-soft)]'
                        : 'border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] hover:border-[var(--aegion-platform-border-strong)]'
                    }`}
                    style={{
                      borderRadius: 'calc(var(--aegion-platform-radius) - 2px)',
                    }}
                  >
                    {/* True Visual Miniature Canvas */}
                    <div
                      className="relative h-16 p-2 border overflow-hidden flex flex-col justify-between"
                      style={{
                        backgroundColor: t.palette.bg,
                        borderColor: t.palette.border,
                        borderRadius: t.palette.btnRadius,
                        fontFamily: t.typography.body,
                      }}
                    >
                      {t.palette.meshPrimary !== 'transparent' && (
                        <div
                          aria-hidden="true"
                          className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-lg pointer-events-none"
                          style={{ background: t.palette.meshPrimary }}
                        />
                      )}
                      {t.visualStyle.pattern === 'swiss-grid' && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 opacity-40 pointer-events-none"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${t.palette.border} 1px, transparent 1px), linear-gradient(to bottom, ${t.palette.border} 1px, transparent 1px)`,
                            backgroundSize: '12px 12px',
                          }}
                        />
                      )}

                      {/* Mini Nav + Badge */}
                      <div className="relative z-10 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: t.palette.accent }}
                          />
                          <span
                            className="text-[10px] font-bold truncate"
                            style={{ color: t.palette.text, fontFamily: t.typography.display }}
                          >
                            Aa · {t.name}
                          </span>
                        </div>
                        {t.recommended && (
                          <span
                            className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 shrink-0"
                            style={{
                              backgroundColor: t.palette.accentSoft,
                              color: t.palette.secondaryAccent,
                              borderRadius: t.palette.btnRadius,
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>

                      {/* Mini Surface Card Strip */}
                      <div className="relative z-10 flex items-center gap-1.5">
                        <div
                          className="flex-1 h-5 px-1.5 border flex items-center justify-between"
                          style={{
                            backgroundColor: t.palette.surface,
                            borderColor: t.palette.border,
                            boxShadow: t.palette.innerHighlight,
                            borderRadius: t.palette.btnRadius,
                          }}
                        >
                          <span
                            className="w-8 h-1.5 rounded-full opacity-75"
                            style={{ backgroundColor: t.palette.textMuted }}
                          />
                          <span
                            className="px-1.5 py-0.5 text-[8px] font-semibold"
                            style={{
                              backgroundColor: t.palette.accent,
                              color: t.palette.accentFg,
                              borderRadius: t.palette.btnRadius,
                            }}
                          >
                            UI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Theme Name & Action Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[var(--aegion-platform-text)] truncate">
                            {t.name}
                          </span>
                          {isPersisted && (
                            <Check
                              className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)] shrink-0"
                              aria-label="Active theme"
                            />
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--aegion-platform-text-muted)] truncate">
                          {t.category} · {t.mode === 'dark' ? 'Dark' : 'Light'}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSavingTheme}
                        onClick={(e) => {
                          e.stopPropagation();
                          void applyTheme(t.id);
                          setOpen(false);
                        }}
                        className="px-2 py-1 text-[10px] font-semibold border transition-colors cursor-pointer shrink-0 aegion-btn-shape"
                        style={{
                          backgroundColor: isPersisted
                            ? 'var(--aegion-platform-cement)'
                            : 'var(--aegion-platform-accent)',
                          borderColor: isPersisted
                            ? 'var(--aegion-platform-border-strong)'
                            : 'var(--aegion-platform-accent)',
                          color: isPersisted
                            ? 'var(--aegion-platform-text)'
                            : 'var(--aegion-platform-accent-fg)',
                        }}
                      >
                        {isPersisted ? 'Active' : 'Apply'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: Live Preview Confirmation or Studio Shortcut */}
            <div className="px-4 py-2.5 border-t border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {isPreviewing && targetPreviewTheme ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--aegion-platform-text)] min-w-0">
                    <Eye className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)] shrink-0" />
                    <span className="truncate">
                      Previewing <strong>{targetPreviewTheme.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => cancelPreview()}
                      className="px-2.5 py-1 text-[11px] font-medium border border-[var(--aegion-platform-border-strong)] text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)] cursor-pointer aegion-btn-shape"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingTheme}
                      onClick={() => {
                        void applyTheme(targetPreviewTheme.id);
                        setOpen(false);
                      }}
                      className="px-3 py-1 text-[11px] font-semibold cursor-pointer aegion-btn-shape"
                      style={{
                        backgroundColor: 'var(--aegion-platform-accent)',
                        color: 'var(--aegion-platform-accent-fg)',
                      }}
                    >
                      Apply Theme
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-[var(--aegion-platform-text-muted)]">
                    Active: <strong className="text-[var(--aegion-platform-text)]">{activeTheme.name}</strong>
                  </span>
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        navigate(user.role === 'super_admin' ? 'admin' : 'themes');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
                    >
                      Open Theme Studio
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
