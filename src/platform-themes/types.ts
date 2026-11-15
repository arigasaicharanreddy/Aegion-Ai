export type PlatformThemeCategory =
  | 'Glassmorphism'
  | 'Enterprise'
  | 'Futuristic AI'
  | 'Modern SaaS'
  | 'Light Executive';

export type PlatformSurfaceStyle =
  | 'glass'
  | 'liquid-glass'
  | 'bordered'
  | 'elevated'
  | 'bento'
  | 'neon-restrained'
  | 'minimal-flat';

export type PlatformNavStyle = 'sidebar-glass' | 'sidebar-solid' | 'sidebar-minimal';
export type PlatformButtonStyle = 'sharp' | 'rounded' | 'pill-subtle' | 'elevated-glow';

export type PlatformAnimationPreset =
  | 'aurora-flow'
  | 'neural-pulse'
  | 'prism-shift'
  | 'bento-drift'
  | 'subtle-breath'
  | 'static';

export type PlatformBackdropPattern =
  | 'glass-mesh'
  | 'aurora'
  | 'graphite-lines'
  | 'neural'
  | 'prism'
  | 'swiss-grid'
  | 'ivory-editorial'
  | 'neon-trace'
  | 'bento-grid'
  | 'minimal';

export interface PlatformThemePalette {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceSolid: string;
  navSurface: string;
  cement: string;
  inputBg: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentFg: string;
  secondaryAccent: string;
  meshPrimary: string;
  meshSecondary: string;
  shadow: string;
  innerHighlight: string;
  backdropFilter: string;
  radius: string;
  btnRadius: string;
}

export interface PlatformThemeDefinition {
  id: string;
  name: string;
  category: PlatformThemeCategory;
  mode: 'dark' | 'light';
  recommended?: boolean;
  tagline: string;
  description: string;
  surfaceStyle: PlatformSurfaceStyle;
  navStyle: PlatformNavStyle;
  buttonStyle: PlatformButtonStyle;
  animationPreset: PlatformAnimationPreset;
  isAnimated: boolean;
  visualStyle: {
    pattern: PlatformBackdropPattern;
    primaryHex: string;
    secondaryHex: string;
    highlightHex: string;
  };
  typography: {
    display: string;
    body: string;
    mono: string;
    label: string;
  };
  palette: PlatformThemePalette;
  badges: string[];
}
