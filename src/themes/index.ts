import { GlassThemePreset, ThemeCategory } from '../types/theme';
import { AppCategory } from '../types/project';
import { HRMS_THEMES } from './hrmsThemes';
import { ECOMMERCE_THEMES } from './ecommerceThemes';
import { MULTISTORE_THEMES } from './multistoreThemes';
import { SAAS_THEMES } from './saasThemes';
import { HEALTHCARE_THEMES } from './healthcareThemes';

export const ALL_THEMES: GlassThemePreset[] = [
  ...HRMS_THEMES,
  ...ECOMMERCE_THEMES,
  ...MULTISTORE_THEMES,
  ...SAAS_THEMES,
  ...HEALTHCARE_THEMES,
];

export const THEME_CATEGORIES: ThemeCategory[] = [
  'HRMS',
  'E-Commerce',
  'Multi-Store',
  'SaaS',
  'Healthcare Store',
];

export function mapAppCategoryToThemeCategory(category: AppCategory): ThemeCategory {
  switch (category) {
    case 'HRMS':
      return 'HRMS';
    case 'E-Commerce':
      return 'E-Commerce';
    case 'Multi-Store Management':
      return 'Multi-Store';
    case 'Healthcare Store Management':
      return 'Healthcare Store';
    case 'SaaS Applications':
    case 'Custom Business Applications':
    default:
      return 'SaaS';
  }
}

export function getThemeById(themeId: string): GlassThemePreset {
  return ALL_THEMES.find((t) => t.id === themeId) || ALL_THEMES[0];
}

export function getDefaultThemeForCategory(category: AppCategory): GlassThemePreset {
  const themeCat = mapAppCategoryToThemeCategory(category);
  return ALL_THEMES.find((t) => t.category === themeCat && t.mode === 'dark') || ALL_THEMES[0];
}
