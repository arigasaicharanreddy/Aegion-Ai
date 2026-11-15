import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PlatformAnimationMode, PlatformThemeGovernanceConfig } from '../types/auth';
import {
  DEFAULT_PLATFORM_THEME_ID,
  getPlatformThemeById,
  isValidPlatformThemeId,
  resolveLegacyPlatformThemeId,
} from '../platform-themes/catalog';
import type { PlatformThemeDefinition } from '../platform-themes/types';
import { useAegion } from './AegionContext';
import { apiClient } from '../services/apiClient';

interface PlatformThemeContextValue {
  activeTheme: PlatformThemeDefinition;
  persistedThemeId: string;
  previewThemeId: string | null;
  isPreviewing: boolean;
  previousThemeId: string | null;
  governanceConfig: PlatformThemeGovernanceConfig;
  animationMode: PlatformAnimationMode;
  effectiveMotionMode: PlatformAnimationMode;
  enable3D: boolean;
  effective3DEnabled: boolean;
  prefersReducedMotion: boolean;
  isSavingTheme: boolean;
  startPreview: (themeId: string) => void;
  cancelPreview: () => void;
  applyTheme: (themeId: string) => Promise<void>;
  restorePreviousTheme: () => Promise<void>;
  resetToDefault: () => Promise<void>;
  updateMotionSettings: (patch: {
    animationMode?: PlatformAnimationMode;
    enable3D?: boolean;
  }) => Promise<void>;
  saveGovernanceConfig: (patch: Partial<PlatformThemeGovernanceConfig>) => Promise<void>;
  refreshGovernanceConfig: () => Promise<void>;
  isThemeDisabledForCurrentUser: (themeId: string) => boolean;
}

const DEFAULT_GOVERNANCE: PlatformThemeGovernanceConfig = {
  defaultPublicThemeId: DEFAULT_PLATFORM_THEME_ID,
  defaultUserThemeId: DEFAULT_PLATFORM_THEME_ID,
  defaultAdminThemeId: 'graphite-executive',
  fallbackThemeId: DEFAULT_PLATFORM_THEME_ID,
  disabledThemeIds: [],
  disabledCategories: [],
  animationsGloballyAllowed: true,
  threeDGloballyAllowed: false,
};

const GUEST_THEME_STORAGE_KEY = 'aegion_guest_platform_theme_v2';

const PlatformThemeContext = createContext<PlatformThemeContextValue | null>(null);

function applyThemeCssVariables(
  theme: PlatformThemeDefinition,
  effectiveMotion: PlatformAnimationMode
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { palette, typography, visualStyle } = theme;

  if (theme.mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  root.setAttribute('data-theme-mode', theme.mode);
  root.setAttribute('data-surface', theme.surfaceStyle);
  root.setAttribute('data-nav-style', theme.navStyle);
  root.setAttribute('data-btn-style', theme.buttonStyle);
  root.setAttribute('data-motion', effectiveMotion);
  root.setAttribute('data-theme-id', theme.id);
  root.setAttribute('data-pattern', visualStyle.pattern);

  root.style.setProperty('--font-display', typography.display);
  root.style.setProperty('--font-body', typography.body);
  root.style.setProperty('--font-mono', typography.mono);

  root.style.setProperty('--aegion-platform-bg', palette.bg);
  root.style.setProperty('--aegion-platform-bg-alt', palette.bgAlt);
  root.style.setProperty('--aegion-platform-surface', palette.surface);
  root.style.setProperty('--aegion-platform-surface-solid', palette.surfaceSolid);
  root.style.setProperty('--aegion-platform-nav-surface', palette.navSurface);
  root.style.setProperty('--aegion-platform-cement', palette.cement);
  root.style.setProperty('--aegion-platform-input-bg', palette.inputBg);
  root.style.setProperty('--aegion-platform-border', palette.border);
  root.style.setProperty('--aegion-platform-border-strong', palette.borderStrong);
  root.style.setProperty('--aegion-platform-text', palette.text);
  root.style.setProperty('--aegion-platform-text-secondary', palette.textSecondary);
  root.style.setProperty('--aegion-platform-text-muted', palette.textMuted);
  root.style.setProperty('--aegion-platform-accent', palette.accent);
  root.style.setProperty('--aegion-platform-accent-hover', palette.accentHover);
  root.style.setProperty('--aegion-platform-accent-soft', palette.accentSoft);
  root.style.setProperty('--aegion-platform-accent-fg', palette.accentFg);
  root.style.setProperty('--aegion-platform-accent-secondary', palette.secondaryAccent);
  root.style.setProperty('--aegion-platform-mesh-primary', palette.meshPrimary);
  root.style.setProperty('--aegion-platform-mesh-secondary', palette.meshSecondary);
  root.style.setProperty('--aegion-platform-shadow', palette.shadow);
  root.style.setProperty('--aegion-platform-inner-highlight', palette.innerHighlight);
  root.style.setProperty('--aegion-platform-backdrop', palette.backdropFilter);
  root.style.setProperty('--aegion-platform-radius', palette.radius);
  root.style.setProperty('--aegion-platform-btn-radius', palette.btnRadius);
  root.style.setProperty(
    '--aegion-platform-blur',
    palette.backdropFilter !== 'none' ? '22px' : '0px'
  );
}

export const PlatformThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUser, notify } = useAegion();
  const [governanceConfig, setGovernanceConfig] =
    useState<PlatformThemeGovernanceConfig>(DEFAULT_GOVERNANCE);
  const [guestThemeId, setGuestThemeId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem(GUEST_THEME_STORAGE_KEY);
      if (!saved) return '';
      const resolved = resolveLegacyPlatformThemeId(saved);
      return isValidPlatformThemeId(resolved) ? resolved : '';
    } catch {
      return '';
    }
  });
  const [guestMotionMode, setGuestMotionMode] = useState<PlatformAnimationMode>('balanced');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [previousThemeId, setPreviousThemeId] = useState<string | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const fallbackNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const refreshGovernanceConfig = useCallback(async () => {
    try {
      const res = await apiClient.getPlatformThemeConfig();
      if (res?.config) {
        setGovernanceConfig({
          ...res.config,
          defaultPublicThemeId: resolveLegacyPlatformThemeId(res.config.defaultPublicThemeId),
          defaultUserThemeId: resolveLegacyPlatformThemeId(res.config.defaultUserThemeId),
          defaultAdminThemeId: resolveLegacyPlatformThemeId(res.config.defaultAdminThemeId),
          fallbackThemeId: resolveLegacyPlatformThemeId(res.config.fallbackThemeId),
        });
      }
    } catch {
      // Keep defaults gracefully
    }
  }, []);

  useEffect(() => {
    void refreshGovernanceConfig();
  }, [refreshGovernanceConfig]);

  // Clear temporary preview state on user switch / logout so preferences never bleed across accounts
  useEffect(() => {
    setPreviewThemeId(null);
    setPreviousThemeId(null);
    fallbackNotifiedRef.current = null;
  }, [user?.id]);

  const isThemeDisabledForCurrentUser = useCallback(
    (themeId: string) => {
      if (user?.role === 'super_admin') return false;
      const def = getPlatformThemeById(themeId);
      return (
        governanceConfig.disabledThemeIds.includes(def.id) ||
        governanceConfig.disabledCategories.includes(def.category)
      );
    },
    [governanceConfig, user?.role]
  );

  const persistedThemeId = useMemo(() => {
    let rawId: string;
    if (user) {
      rawId =
        user.platformTheme?.themeId ||
        (user.role === 'super_admin'
          ? governanceConfig.defaultAdminThemeId
          : governanceConfig.defaultUserThemeId);
    } else {
      rawId = guestThemeId || governanceConfig.defaultPublicThemeId;
    }

    const resolvedId = resolveLegacyPlatformThemeId(rawId);

    if (isThemeDisabledForCurrentUser(resolvedId)) {
      return resolveLegacyPlatformThemeId(governanceConfig.fallbackThemeId);
    }

    return resolvedId;
  }, [
    user,
    guestThemeId,
    governanceConfig.defaultAdminThemeId,
    governanceConfig.defaultUserThemeId,
    governanceConfig.defaultPublicThemeId,
    governanceConfig.fallbackThemeId,
    isThemeDisabledForCurrentUser,
  ]);

  useEffect(() => {
    if (!user?.platformTheme?.themeId) return;
    const desired = resolveLegacyPlatformThemeId(user.platformTheme.themeId);
    if (
      isThemeDisabledForCurrentUser(desired) &&
      fallbackNotifiedRef.current !== `${user.id}:${desired}`
    ) {
      fallbackNotifiedRef.current = `${user.id}:${desired}`;
      const desiredName = getPlatformThemeById(desired).name;
      const fallbackName = getPlatformThemeById(governanceConfig.fallbackThemeId).name;
      notify(
        `Theme "${desiredName}" was disabled by administrator policy. Switched cleanly to "${fallbackName}".`,
        'info'
      );
    }
  }, [user, governanceConfig.fallbackThemeId, isThemeDisabledForCurrentUser, notify]);

  const resolvedThemeId = useMemo(() => {
    if (previewThemeId && isValidPlatformThemeId(previewThemeId)) {
      return previewThemeId;
    }
    return persistedThemeId;
  }, [previewThemeId, persistedThemeId]);

  const activeTheme = useMemo(() => getPlatformThemeById(resolvedThemeId), [resolvedThemeId]);

  const animationMode: PlatformAnimationMode = user
    ? user.platformTheme?.animationMode || 'balanced'
    : guestMotionMode;

  const effectiveMotionMode: PlatformAnimationMode = useMemo(() => {
    if (prefersReducedMotion) return 'disabled';
    if (!governanceConfig.animationsGloballyAllowed && user?.role !== 'super_admin') {
      return 'disabled';
    }
    return animationMode;
  }, [prefersReducedMotion, governanceConfig.animationsGloballyAllowed, user?.role, animationMode]);

  useEffect(() => {
    applyThemeCssVariables(activeTheme, effectiveMotionMode);
  }, [activeTheme, effectiveMotionMode]);

  const startPreview = useCallback((themeId: string) => {
    const resolved = resolveLegacyPlatformThemeId(themeId);
    if (!isValidPlatformThemeId(resolved)) return;
    setPreviewThemeId(resolved);
  }, []);

  const cancelPreview = useCallback(() => {
    setPreviewThemeId(null);
  }, []);

  const applyTheme = useCallback(
    async (themeId: string) => {
      const resolved = resolveLegacyPlatformThemeId(themeId);
      if (!isValidPlatformThemeId(resolved)) {
        notify('Selected theme was not found.', 'error');
        return;
      }
      if (isThemeDisabledForCurrentUser(resolved)) {
        notify('This theme is currently disabled by Super Admin policy.', 'error');
        return;
      }

      const prevId = persistedThemeId;
      setPreviewThemeId(null);

      if (!user) {
        setPreviousThemeId(prevId !== resolved ? prevId : previousThemeId);
        setGuestThemeId(resolved);
        try {
          sessionStorage.setItem(GUEST_THEME_STORAGE_KEY, resolved);
        } catch {
          // ignore
        }
        notify(`Applied "${getPlatformThemeById(resolved).name}" theme`, 'success');
        return;
      }

      setIsSavingTheme(true);
      try {
        const res = await apiClient.saveUserThemePreference({
          themeId: resolved,
          animationMode,
          enable3D: false,
        });
        setPreviousThemeId(prevId !== resolved ? prevId : previousThemeId);
        updateCurrentUser(res.user);
        if (res.warning) {
          notify(res.warning, 'info');
        } else {
          notify(
            `Applied "${getPlatformThemeById(res.user.platformTheme?.themeId || resolved).name}" to your account`,
            'success'
          );
        }
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Unable to save theme preference', 'error');
      } finally {
        setIsSavingTheme(false);
      }
    },
    [
      user,
      persistedThemeId,
      previousThemeId,
      animationMode,
      isThemeDisabledForCurrentUser,
      updateCurrentUser,
      notify,
    ]
  );

  const restorePreviousTheme = useCallback(async () => {
    if (!previousThemeId) {
      notify('No previous platform theme recorded in this session.', 'info');
      return;
    }
    const target = previousThemeId;
    setPreviousThemeId(null);
    await applyTheme(target);
  }, [previousThemeId, applyTheme, notify]);

  const resetToDefault = useCallback(async () => {
    const defaultId = user
      ? user.role === 'super_admin'
        ? governanceConfig.defaultAdminThemeId
        : governanceConfig.defaultUserThemeId
      : governanceConfig.defaultPublicThemeId;
    setPreviewThemeId(null);
    if (!user) {
      try {
        sessionStorage.removeItem(GUEST_THEME_STORAGE_KEY);
      } catch {
        // ignore
      }
      setGuestThemeId('');
      notify(`Restored default theme (${getPlatformThemeById(defaultId).name})`, 'success');
      return;
    }
    await applyTheme(defaultId);
  }, [
    user,
    governanceConfig.defaultAdminThemeId,
    governanceConfig.defaultUserThemeId,
    governanceConfig.defaultPublicThemeId,
    applyTheme,
    notify,
  ]);

  const updateMotionSettings = useCallback(
    async (patch: { animationMode?: PlatformAnimationMode; enable3D?: boolean }) => {
      const nextMode = patch.animationMode ?? animationMode;

      if (!user) {
        setGuestMotionMode(nextMode);
        notify('Updated motion preference', 'success');
        return;
      }

      setIsSavingTheme(true);
      try {
        const res = await apiClient.saveUserThemePreference({
          themeId: persistedThemeId,
          animationMode: nextMode,
          enable3D: false,
        });
        updateCurrentUser(res.user);
        notify('Saved motion preference to your profile', 'success');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Unable to save motion settings', 'error');
      } finally {
        setIsSavingTheme(false);
      }
    },
    [user, animationMode, persistedThemeId, updateCurrentUser, notify]
  );

  const saveGovernanceConfig = useCallback(
    async (patch: Partial<PlatformThemeGovernanceConfig>) => {
      setIsSavingTheme(true);
      try {
        const res = await apiClient.updateAdminPlatformThemeConfig(patch);
        setGovernanceConfig(res.config);
        notify('Saved platform-wide theme governance policy', 'success');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Failed to save governance policy', 'error');
      } finally {
        setIsSavingTheme(false);
      }
    },
    [notify]
  );

  const value = useMemo<PlatformThemeContextValue>(
    () => ({
      activeTheme,
      persistedThemeId,
      previewThemeId,
      isPreviewing: Boolean(previewThemeId),
      previousThemeId,
      governanceConfig,
      animationMode,
      effectiveMotionMode,
      enable3D: false,
      effective3DEnabled: false,
      prefersReducedMotion,
      isSavingTheme,
      startPreview,
      cancelPreview,
      applyTheme,
      restorePreviousTheme,
      resetToDefault,
      updateMotionSettings,
      saveGovernanceConfig,
      refreshGovernanceConfig,
      isThemeDisabledForCurrentUser,
    }),
    [
      activeTheme,
      persistedThemeId,
      previewThemeId,
      previousThemeId,
      governanceConfig,
      animationMode,
      effectiveMotionMode,
      prefersReducedMotion,
      isSavingTheme,
      startPreview,
      cancelPreview,
      applyTheme,
      restorePreviousTheme,
      resetToDefault,
      updateMotionSettings,
      saveGovernanceConfig,
      refreshGovernanceConfig,
      isThemeDisabledForCurrentUser,
    ]
  );

  return (
    <PlatformThemeContext.Provider value={value}>{children}</PlatformThemeContext.Provider>
  );
};

export function usePlatformTheme() {
  const ctx = useContext(PlatformThemeContext);
  if (!ctx) {
    throw new Error('usePlatformTheme must be used inside PlatformThemeProvider');
  }
  return ctx;
}
