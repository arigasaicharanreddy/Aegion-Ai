import { ThemeCustomization } from '../types/theme';

const STORAGE_KEY = 'aegion_theme_customizations_v1';

export function loadThemeCustomizations(): Record<string, ThemeCustomization> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveThemeCustomizations(map: Record<string, ThemeCustomization>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota issues
  }
}
