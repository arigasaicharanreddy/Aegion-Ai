import { GlassThemePreset, ThemeCustomization, ThemeMode, ThemeTokens } from '../types/theme';

export function buildTokens(
  mode: ThemeMode,
  background: string,
  surface: string,
  accent: string
): ThemeTokens {
  const isLight = mode === 'light';
  return {
    background,
    surface,
    surfaceElevated: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.06)',
    border: isLight ? 'rgba(15, 23, 42, 0.09)' : 'rgba(255, 255, 255, 0.1)',
    text: isLight ? '#0F172A' : '#F8FAFC',
    textMuted: isLight ? '#475569' : '#94A3B8',
    accent,
    accentForeground: isLight ? '#FFFFFF' : '#09090C',
    shadow: isLight
      ? '0 12px 30px -10px rgba(15, 23, 42, 0.09)'
      : '0 16px 36px -12px rgba(0, 0, 0, 0.5)',
    glassOpacity: isLight ? 0.84 : 0.78,
    blurPx: 14,
    radiusPx: 12,
  };
}

export function resolveThemeVariables(
  preset: GlassThemePreset,
  customization?: ThemeCustomization
): Record<string, string> {
  const bg = customization?.backgroundOverride || preset.tokens.background;
  const accent = customization?.accentOverride || preset.tokens.accent;
  const glassOpacity =
    customization?.glassOpacityOverride !== undefined
      ? customization.glassOpacityOverride
      : preset.tokens.glassOpacity;
  const blur =
    customization?.blurPxOverride !== undefined
      ? customization.blurPxOverride
      : preset.tokens.blurPx;
  const radius =
    customization?.radiusPxOverride !== undefined
      ? customization.radiusPxOverride
      : preset.tokens.radiusPx;
  const fontDisplay = customization?.fontDisplayOverride || 'Manrope';
  const fontBody = customization?.fontBodyOverride || 'Plus Jakarta Sans';

  return {
    '--preview-bg': bg,
    '--preview-surface': preset.tokens.surface,
    '--preview-surface-elevated': preset.tokens.surfaceElevated,
    '--preview-border': preset.tokens.border,
    '--preview-text': preset.tokens.text,
    '--preview-text-muted': preset.tokens.textMuted,
    '--preview-accent': accent,
    '--preview-accent-fg': preset.tokens.accentForeground,
    '--preview-shadow': preset.tokens.shadow,
    '--preview-glass-opacity': String(glassOpacity),
    '--preview-blur': `${blur}px`,
    '--preview-radius': `${radius}px`,
    '--preview-font-display': `'${fontDisplay}', system-ui, sans-serif`,
    '--preview-font-body': `'${fontBody}', system-ui, sans-serif`,
  };
}
