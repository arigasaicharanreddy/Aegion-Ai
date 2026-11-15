import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GlassThemePreset, ThemeCustomization } from '../../types/theme';
import { Button } from '../common/Button';
import { ThemePreview } from './ThemePreview';

interface ThemeCustomizerProps {
  preset: GlassThemePreset;
  initialCustomization?: ThemeCustomization;
  onSave: (customization: ThemeCustomization) => void;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  preset,
  initialCustomization,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<ThemeCustomization>(() => ({
    presetId: preset.id,
    accentOverride: initialCustomization?.accentOverride || preset.tokens.accent,
    backgroundOverride: initialCustomization?.backgroundOverride || preset.tokens.background,
    glassOpacityOverride:
      initialCustomization?.glassOpacityOverride ?? preset.tokens.glassOpacity,
    blurPxOverride: initialCustomization?.blurPxOverride ?? preset.tokens.blurPx,
    radiusPxOverride: initialCustomization?.radiusPxOverride ?? preset.tokens.radiusPx,
    fontDisplayOverride: initialCustomization?.fontDisplayOverride || 'Manrope',
    fontBodyOverride: initialCustomization?.fontBodyOverride || 'Plus Jakarta Sans',
  }));

  const handleReset = () => {
    setDraft({
      presetId: preset.id,
      accentOverride: preset.tokens.accent,
      backgroundOverride: preset.tokens.background,
      glassOpacityOverride: preset.tokens.glassOpacity,
      blurPxOverride: preset.tokens.blurPx,
      radiusPxOverride: preset.tokens.radiusPx,
      fontDisplayOverride: 'Manrope',
      fontBodyOverride: 'Plus Jakarta Sans',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Accent Color</span>
            <div className="flex items-center gap-2 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] rounded-lg px-2.5 py-1.5">
              <input
                type="color"
                value={draft.accentOverride}
                onChange={(e) => setDraft({ ...draft, accentOverride: e.target.value })}
                className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-xs font-mono text-[var(--aegion-platform-text)]">{draft.accentOverride}</span>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Canvas Background</span>
            <div className="flex items-center gap-2 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] rounded-lg px-2.5 py-1.5">
              <input
                type="color"
                value={draft.backgroundOverride}
                onChange={(e) => setDraft({ ...draft, backgroundOverride: e.target.value })}
                className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-xs font-mono text-[var(--aegion-platform-text)]">{draft.backgroundOverride}</span>
            </div>
          </label>
        </div>

        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--aegion-platform-text-secondary)]">Glass Opacity</span>
            <span className="font-mono tabular-nums text-[var(--aegion-platform-text-muted)]">
              {Math.round((draft.glassOpacityOverride ?? 0.8) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.35}
            max={0.98}
            step={0.02}
            value={draft.glassOpacityOverride}
            onChange={(e) =>
              setDraft({ ...draft, glassOpacityOverride: parseFloat(e.target.value) })
            }
            className="w-full accent-[var(--aegion-platform-accent)]"
          />
        </label>

        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--aegion-platform-text-secondary)]">Backdrop Blur</span>
            <span className="font-mono tabular-nums text-[var(--aegion-platform-text-muted)]">{draft.blurPxOverride}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={28}
            step={2}
            value={draft.blurPxOverride}
            onChange={(e) => setDraft({ ...draft, blurPxOverride: parseInt(e.target.value, 10) })}
            className="w-full accent-[var(--aegion-platform-accent)]"
          />
        </label>

        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--aegion-platform-text-secondary)]">Corner Radius</span>
            <span className="font-mono tabular-nums text-[var(--aegion-platform-text-muted)]">{draft.radiusPxOverride}px</span>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={2}
            value={draft.radiusPxOverride}
            onChange={(e) => setDraft({ ...draft, radiusPxOverride: parseInt(e.target.value, 10) })}
            className="w-full accent-[var(--aegion-platform-accent)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Display Typography</span>
          <select
            value={draft.fontDisplayOverride}
            onChange={(e) =>
              setDraft({
                ...draft,
                fontDisplayOverride: e.target.value as ThemeCustomization['fontDisplayOverride'],
              })
            }
            className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] rounded-lg px-3 py-2 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
          >
            <option value="Manrope">Manrope (Default Enterprise)</option>
            <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
            <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
          </select>
        </label>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Tokens
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              Save Tokens
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-[var(--aegion-platform-text-muted)]">
          Live CSS token preview — updates visual appearance without altering application logic.
        </p>
        <ThemePreview preset={preset} customization={draft} selected />
      </div>
    </div>
  );
};
