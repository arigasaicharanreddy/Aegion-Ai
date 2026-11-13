export type ThemeCategory =
  | 'HRMS'
  | 'E-Commerce'
  | 'Multi-Store'
  | 'SaaS'
  | 'Healthcare Store';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentForeground: string;
  shadow: string;
  glassOpacity: number;
  blurPx: number;
  radiusPx: number;
}

export interface GlassThemePreset {
  id: string;
  name: string;
  category: ThemeCategory;
  mode: ThemeMode;
  description: string;
  tokens: ThemeTokens;
}

export interface ThemeCustomization {
  presetId: string;
  accentOverride?: string;
  backgroundOverride?: string;
  glassOpacityOverride?: number;
  blurPxOverride?: number;
  radiusPxOverride?: number;
  fontDisplayOverride?: 'Manrope' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  fontBodyOverride?: 'Plus Jakarta Sans' | 'Manrope';
}
