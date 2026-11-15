import React from 'react';
import {
  Check,
  Eye,
  Lock,
  Sparkles,
  Star,
  Unlock,
} from 'lucide-react';
import type { PlatformThemeDefinition } from '../../platform-themes/types';

interface PlatformThemeCardProps {
  theme: PlatformThemeDefinition;
  isActive: boolean;
  isPreviewing: boolean;
  isDisabledForUsers: boolean;
  isAdminMode?: boolean;
  defaultBadges?: string[];
  onPreview: () => void;
  onApply: () => void;
  onToggleAdminDisable?: () => void;
}

export const PlatformThemeCard: React.FC<PlatformThemeCardProps> = ({
  theme,
  isActive,
  isPreviewing,
  isDisabledForUsers,
  isAdminMode = false,
  defaultBadges = [],
  onPreview,
  onApply,
  onToggleAdminDisable,
}) => {
  const { palette, typography, visualStyle } = theme;
  const blocked = !isAdminMode && isDisabledForUsers;

  const showGridOverlay =
    visualStyle.pattern === 'swiss-grid' ||
    visualStyle.pattern === 'bento-grid' ||
    visualStyle.pattern === 'graphite-lines';

  return (
    <div
      className={`flex flex-col justify-between transition-all duration-200 border overflow-hidden ${
        isActive || isPreviewing
          ? 'ring-2 ring-[var(--aegion-platform-accent)] border-[var(--aegion-platform-accent)]'
          : 'border-[var(--aegion-platform-border)] hover:border-[var(--aegion-platform-border-strong)]'
      } ${blocked ? 'opacity-65' : ''}`}
      style={{
        backgroundColor: 'var(--aegion-platform-surface-solid)',
        borderRadius: 'var(--aegion-platform-radius)',
        boxShadow: isActive ? 'var(--aegion-platform-shadow)' : undefined,
      }}
    >
      {/* Live Visual Miniature Platform Mockup */}
      <div
        className="relative h-44 p-3 flex flex-col justify-between overflow-hidden border-b"
        style={{
          backgroundColor: palette.bg,
          borderColor: palette.border,
          color: palette.text,
          fontFamily: typography.body,
        }}
      >
        {/* Theme-Accurate Miniature Backdrop */}
        {palette.meshPrimary !== 'transparent' && (
          <>
            <div
              aria-hidden="true"
              className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-2xl pointer-events-none"
              style={{ background: palette.meshPrimary }}
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl pointer-events-none"
              style={{ background: palette.meshSecondary }}
            />
          </>
        )}

        {showGridOverlay && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              backgroundImage: `linear-gradient(to right, ${palette.border} 1px, transparent 1px), linear-gradient(to bottom, ${palette.border} 1px, transparent 1px)`,
              backgroundSize: '18px 18px',
            }}
          />
        )}

        {/* Miniature Top Navigation */}
        <div
          className="relative z-10 flex items-center justify-between gap-2 px-2 py-1 border"
          style={{
            backgroundColor: palette.navSurface,
            borderColor: palette.border,
            borderRadius: palette.btnRadius,
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-4 h-4 flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{
                backgroundColor: palette.accent,
                color: palette.accentFg,
                borderRadius: palette.btnRadius,
              }}
            >
              A
            </span>
            <span
              className="text-[11px] font-bold truncate"
              style={{ fontFamily: typography.display }}
            >
              {theme.name}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {theme.recommended && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5"
                style={{
                  backgroundColor: palette.accentSoft,
                  color: palette.secondaryAccent,
                  border: `1px solid ${palette.borderStrong}`,
                  borderRadius: palette.btnRadius,
                }}
              >
                <Star className="w-2.5 h-2.5" />
                Recommended
              </span>
            )}
            {theme.isAnimated && !theme.recommended && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5"
                style={{
                  backgroundColor: palette.accentSoft,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: palette.btnRadius,
                }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Motion
              </span>
            )}
          </div>
        </div>

        {/* Miniature Split Workspace Preview */}
        <div className="relative z-10 flex gap-2 h-24 mt-2">
          {/* Miniature Sidebar */}
          <div
            className="w-12 p-1.5 flex flex-col gap-1 border shrink-0"
            style={{
              backgroundColor: palette.bgAlt,
              borderColor: palette.border,
              borderRadius: palette.btnRadius,
            }}
          >
            <div
              className="h-2 w-full rounded-sm"
              style={{ backgroundColor: palette.accent }}
            />
            <div
              className="h-1.5 w-8 rounded-sm opacity-45"
              style={{ backgroundColor: palette.textMuted }}
            />
            <div
              className="h-1.5 w-7 rounded-sm opacity-35"
              style={{ backgroundColor: palette.textMuted }}
            />
            <div
              className="mt-auto h-2 w-full rounded-sm opacity-35"
              style={{ backgroundColor: palette.secondaryAccent }}
            />
          </div>

          {/* Miniature Surface Card */}
          <div
            className="flex-1 p-2 flex flex-col justify-between border"
            style={{
              backgroundColor: palette.surface,
              borderColor:
                theme.surfaceStyle === 'bordered' ? palette.borderStrong : palette.border,
              borderRadius: palette.radius,
              boxShadow: palette.innerHighlight,
              backdropFilter:
                palette.backdropFilter !== 'none' ? palette.backdropFilter : undefined,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <div
                  className="text-[11px] font-bold truncate"
                  style={{ fontFamily: typography.display }}
                >
                  Workspace Studio
                </div>
                <div
                  className="text-[9px] truncate"
                  style={{ color: palette.textMuted }}
                >
                  {theme.surfaceStyle} · {theme.buttonStyle}
                </div>
              </div>
              <span
                className="px-2 py-0.5 text-[9px] font-semibold shrink-0"
                style={{
                  backgroundColor: palette.accent,
                  color: palette.accentFg,
                  borderRadius: palette.btnRadius,
                }}
              >
                Action
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[palette.accent, palette.secondaryAccent, palette.textSecondary].map((c, idx) => (
                <div
                  key={idx}
                  className="h-4 border flex items-center px-1"
                  style={{
                    backgroundColor: palette.inputBg,
                    borderColor: palette.border,
                    borderRadius: palette.btnRadius,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata & Action Controls */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                {theme.name}
              </h4>
              <p className="text-[11px] text-[var(--aegion-platform-text-muted)]">
                {theme.category} · {theme.mode === 'dark' ? 'Dark' : 'Light'} · {theme.typography.label}
              </p>
            </div>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border-strong)] shrink-0">
                <Check className="w-3 h-3 text-[var(--aegion-platform-accent)]" />
                Active
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--aegion-platform-text-secondary)] mt-2 line-clamp-2">
            {theme.tagline}
          </p>

          {(defaultBadges.length > 0 || isDisabledForUsers || theme.recommended) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.recommended && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-accent)] border border-[var(--aegion-platform-border-strong)] font-medium">
                  Primary Recommended
                </span>
              )}
              {defaultBadges.map((b) => (
                <span
                  key={b}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border)]"
                >
                  {b}
                </span>
              ))}
              {isDisabledForUsers && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">
                  Disabled by Admin
                </span>
              )}
            </div>
          )}
        </div>

        {/* Swatches + Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--aegion-platform-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {[
                palette.bg,
                palette.surfaceSolid,
                palette.accent,
                palette.secondaryAccent,
                palette.text,
              ].map((hex, i) => (
                <span
                  key={`${hex}-${i}`}
                  title={hex}
                  className="w-4 h-4 rounded border border-[var(--aegion-platform-border-strong)]"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[var(--aegion-platform-text-muted)]">
              {theme.surfaceStyle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={blocked}
              onClick={onPreview}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed aegion-btn-shape ${
                isPreviewing
                  ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                  : 'bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {isPreviewing ? 'Previewing' : 'Preview'}
            </button>

            <button
              type="button"
              disabled={blocked}
              onClick={onApply}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed aegion-btn-shape"
              style={{
                backgroundColor: isActive
                  ? 'var(--aegion-platform-cement)'
                  : 'var(--aegion-platform-accent)',
                color: isActive
                  ? 'var(--aegion-platform-text)'
                  : 'var(--aegion-platform-accent-fg)',
              }}
            >
              {isActive ? 'Applied' : 'Apply Theme'}
            </button>

            {isAdminMode && onToggleAdminDisable && (
              <button
                type="button"
                onClick={onToggleAdminDisable}
                title={
                  isDisabledForUsers
                    ? 'Enable theme for regular users'
                    : 'Disable theme for regular users'
                }
                className={`p-1.5 border transition-colors cursor-pointer aegion-btn-shape ${
                  isDisabledForUsers
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {isDisabledForUsers ? (
                  <Unlock className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
