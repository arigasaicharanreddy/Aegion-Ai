import React from 'react';
import { GlassThemePreset, ThemeCustomization } from '../../types/theme';
import { resolveThemeVariables } from '../../themes/themeTokens';

interface ThemePreviewProps {
  preset: GlassThemePreset;
  customization?: ThemeCustomization;
  selected?: boolean;
  onSelect?: () => void;
  onCustomize?: () => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  preset,
  customization,
  selected = false,
  onSelect,
  onCustomize,
}) => {
  const vars = resolveThemeVariables(preset, customization);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 overflow-hidden flex flex-col ${
        selected
          ? 'border-[#8B5CF6] ring-1 ring-[#8B5CF6]/50 bg-[#171822]'
          : 'border-white/10 bg-[#121318] hover:border-white/20'
      }`}
    >
      {/* Live tokenized mini app preview */}
      <div
        onClick={onSelect}
        style={vars as React.CSSProperties}
        className="p-4 cursor-pointer relative overflow-hidden"
      >
        <div
          style={{
            backgroundColor: 'var(--preview-bg)',
            color: 'var(--preview-text)',
            fontFamily: 'var(--preview-font-body)',
          }}
          className="rounded-lg p-3.5 border border-black/10 relative overflow-hidden"
        >
          {/* Ambient soft radial highlight */}
          <div
            style={{
              background: `radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--preview-accent) 22%, transparent), transparent 60%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: 'var(--preview-accent)' }}
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                />
                <span
                  style={{ fontFamily: 'var(--preview-font-display)' }}
                  className="text-xs font-semibold truncate"
                >
                  {preset.category} Console
                </span>
              </div>
              <span
                style={{
                  backgroundColor: 'var(--preview-accent)',
                  color: 'var(--preview-accent-fg)',
                  borderRadius: 'calc(var(--preview-radius) * 0.5)',
                }}
                className="px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
              >
                Action
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--preview-surface) calc(var(--preview-glass-opacity) * 100%), transparent)',
                  borderColor: 'var(--preview-border)',
                  borderRadius: 'calc(var(--preview-radius) * 0.65)',
                }}
                className="p-2 border"
              >
                <div style={{ color: 'var(--preview-text-muted)' }} className="text-[10px]">
                  Active Records
                </div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">1,428</div>
              </div>
              <div
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--preview-surface) calc(var(--preview-glass-opacity) * 100%), transparent)',
                  borderColor: 'var(--preview-border)',
                  borderRadius: 'calc(var(--preview-radius) * 0.65)',
                }}
                className="p-2 border"
              >
                <div style={{ color: 'var(--preview-text-muted)' }} className="text-[10px]">
                  SLA Compliance
                </div>
                <div style={{ color: 'var(--preview-accent)' }} className="text-sm font-semibold tabular-nums mt-0.5">
                  99.4%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata footer — unboxed clean typography */}
      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white font-display">{preset.name}</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {preset.category} · {preset.mode === 'light' ? 'Light' : 'Dark'}
            </p>
          </div>
          <div className="flex items-center gap-1 pt-0.5" title="Background / Surface / Accent tokens">
            <span
              className="w-3.5 h-3.5 rounded-sm border border-white/15"
              style={{ backgroundColor: customization?.backgroundOverride || preset.tokens.background }}
            />
            <span
              className="w-3.5 h-3.5 rounded-sm border border-white/15"
              style={{ backgroundColor: preset.tokens.surface }}
            />
            <span
              className="w-3.5 h-3.5 rounded-sm border border-white/15"
              style={{ backgroundColor: customization?.accentOverride || preset.tokens.accent }}
            />
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF] line-clamp-1">{preset.description}</p>
        <div className="flex items-center gap-2 pt-1">
          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selected
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white/[0.06] hover:bg-white/[0.11] text-[#E5E7EB]'
              }`}
            >
              {selected ? 'Active Theme' : 'Apply Theme'}
            </button>
          )}
          {onCustomize && (
            <button
              type="button"
              onClick={onCustomize}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.09] text-[#D1D5DB] border border-white/10 whitespace-nowrap cursor-pointer"
            >
              Customize
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
