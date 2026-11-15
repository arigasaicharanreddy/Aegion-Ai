import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { useAegion } from '../../context/AegionContext';
import { usePlatformTheme } from '../../context/PlatformThemeContext';
import {
  getPlatformThemeById,
  PLATFORM_THEMES,
  PLATFORM_THEME_CATEGORIES,
} from '../../platform-themes/catalog';
import type { PlatformAnimationMode } from '../../types/auth';
import { PlatformThemeCard } from './PlatformThemeCard';

interface PlatformThemeGalleryProps {
  allowAdminGovernance?: boolean;
}

type CategoryFilter = 'All' | 'Light' | 'Dark' | (typeof PLATFORM_THEME_CATEGORIES)[number];

export const PlatformThemeGallery: React.FC<PlatformThemeGalleryProps> = ({
  allowAdminGovernance = false,
}) => {
  const { user } = useAegion();
  const {
    activeTheme,
    persistedThemeId,
    previewThemeId,
    isPreviewing,
    previousThemeId,
    governanceConfig,
    animationMode,
    prefersReducedMotion,
    isSavingTheme,
    startPreview,
    cancelPreview,
    applyTheme,
    restorePreviousTheme,
    resetToDefault,
    updateMotionSettings,
    saveGovernanceConfig,
    isThemeDisabledForCurrentUser,
  } = usePlatformTheme();

  const isAdmin = user?.role === 'super_admin';
  const showGovernance = allowAdminGovernance && isAdmin;

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [search, setSearch] = useState('');

  // Local governance draft state for Super Admin panel
  const [govDraft, setGovDraft] = useState(governanceConfig);
  useEffect(() => {
    setGovDraft(governanceConfig);
  }, [governanceConfig]);

  const filteredThemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PLATFORM_THEMES.filter((t) => {
      if (categoryFilter === 'Light' && t.mode !== 'light') return false;
      if (categoryFilter === 'Dark' && t.mode !== 'dark') return false;
      if (
        categoryFilter !== 'All' &&
        categoryFilter !== 'Light' &&
        categoryFilter !== 'Dark' &&
        t.category !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.typography.label.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, search]);

  const toggleDisabledThemeDraft = (themeId: string) => {
    if (themeId === govDraft.fallbackThemeId) return;
    setGovDraft((prev) => {
      const exists = prev.disabledThemeIds.includes(themeId);
      return {
        ...prev,
        disabledThemeIds: exists
          ? prev.disabledThemeIds.filter((id) => id !== themeId)
          : [...prev.disabledThemeIds, themeId],
      };
    });
  };

  const toggleDisabledCategoryDraft = (cat: string) => {
    setGovDraft((prev) => {
      const exists = prev.disabledCategories.includes(cat);
      return {
        ...prev,
        disabledCategories: exists
          ? prev.disabledCategories.filter((c) => c !== cat)
          : [...prev.disabledCategories, cat],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Active Banner */}
      {isPreviewing && previewThemeId && (
        <div className="aegion-glass p-4 border-[var(--aegion-platform-accent)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[var(--aegion-platform-accent)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--aegion-platform-text)]">
                Live Previewing: {getPlatformThemeById(previewThemeId).name}
              </p>
              <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                Temporary preview active across the Aegion AI interface. Apply to persist to your account profile.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelPreview}
              className="px-3 py-1.5 text-xs font-medium border border-[var(--aegion-platform-border-strong)] bg-[var(--aegion-platform-bg-alt)] text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)] inline-flex items-center gap-1.5 cursor-pointer aegion-btn-shape"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Preview
            </button>
            <button
              type="button"
              disabled={isSavingTheme}
              onClick={() => void applyTheme(previewThemeId)}
              className="px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer aegion-btn-shape"
              style={{
                backgroundColor: 'var(--aegion-platform-accent)',
                color: 'var(--aegion-platform-accent-fg)',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm & Apply Theme
            </button>
          </div>
        </div>
      )}

      {/* Active Theme Summary + Motion Control Strip */}
      <div className="aegion-glass p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border)]">
                {PLATFORM_THEMES.length} Curated Platform Themes
              </span>
              <span className="text-[11px] text-[var(--aegion-platform-text-muted)]">
                Applies across Aegion AI UI · Separate from generated app themes
              </span>
            </div>
            <h3 className="text-xl font-bold text-[var(--aegion-platform-text)] mt-2 font-display">
              Active Theme: {activeTheme.name}
            </h3>
            <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-0.5">
              {activeTheme.category} · {activeTheme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'} ·{' '}
              {activeTheme.typography.label} · {activeTheme.surfaceStyle} surface
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previousThemeId && (
              <button
                type="button"
                disabled={isSavingTheme}
                onClick={() => void restorePreviousTheme()}
                className="px-3 py-2 text-xs font-medium border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] text-[var(--aegion-platform-text)] inline-flex items-center gap-1.5 cursor-pointer aegion-btn-shape"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Restore Previous
              </button>
            )}
            <button
              type="button"
              disabled={isSavingTheme}
              onClick={() => void resetToDefault()}
              className="px-3 py-2 text-xs font-medium border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] text-[var(--aegion-platform-text)] inline-flex items-center gap-1.5 cursor-pointer aegion-btn-shape"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          </div>
        </div>

        {/* Restrained Motion Intensity Controls */}
        <div className="pt-4 border-t border-[var(--aegion-platform-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--aegion-platform-text-secondary)] mr-1">
              <Sliders className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
              Animation Intensity:
            </span>
            {(
              [
                { id: 'full', label: 'Full Motion' },
                { id: 'balanced', label: 'Balanced Motion' },
                { id: 'minimal', label: 'Minimal Motion' },
                { id: 'disabled', label: 'Motion Disabled' },
              ] as { id: PlatformAnimationMode; label: string }[]
            ).map((opt) => {
              const selected = animationMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSavingTheme}
                  onClick={() => void updateMotionSettings({ animationMode: opt.id })}
                  className={`px-2.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer aegion-btn-shape ${
                    selected
                      ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                      : 'bg-[var(--aegion-platform-bg-alt)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {prefersReducedMotion && (
            <span className="text-[11px] text-amber-400">
              OS Reduced Motion active
            </span>
          )}
        </div>
      </div>

      {/* Super Admin Governance Control Plane */}
      {showGovernance && (
        <div className="aegion-glass p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--aegion-platform-text)]">
                  Super Admin Theme Library Governance
                </h4>
                <p className="text-xs text-[var(--aegion-platform-text-muted)]">
                  Configure platform defaults, fallback protection, motion permissions, and available theme categories.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingTheme}
              onClick={() => void saveGovernanceConfig(govDraft)}
              className="px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer aegion-btn-shape"
              style={{
                backgroundColor: 'var(--aegion-platform-accent)',
                color: 'var(--aegion-platform-accent-fg)',
              }}
            >
              <Save className="w-3.5 h-3.5" />
              Save Governance Policy
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--aegion-platform-text-muted)] mb-1">
                Default Public Website Theme
              </label>
              <select
                value={govDraft.defaultPublicThemeId}
                onChange={(e) =>
                  setGovDraft((prev) => ({ ...prev, defaultPublicThemeId: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-input-bg)] text-[var(--aegion-platform-text)] aegion-btn-shape"
              >
                {PLATFORM_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--aegion-platform-text-muted)] mb-1">
                Default New User Theme
              </label>
              <select
                value={govDraft.defaultUserThemeId}
                onChange={(e) =>
                  setGovDraft((prev) => ({ ...prev, defaultUserThemeId: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-input-bg)] text-[var(--aegion-platform-text)] aegion-btn-shape"
              >
                {PLATFORM_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--aegion-platform-text-muted)] mb-1">
                Default Super Admin Theme
              </label>
              <select
                value={govDraft.defaultAdminThemeId}
                onChange={(e) =>
                  setGovDraft((prev) => ({ ...prev, defaultAdminThemeId: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-input-bg)] text-[var(--aegion-platform-text)] aegion-btn-shape"
              >
                {PLATFORM_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--aegion-platform-text-muted)] mb-1">
                Automatic Fallback Theme
              </label>
              <select
                value={govDraft.fallbackThemeId}
                onChange={(e) =>
                  setGovDraft((prev) => ({
                    ...prev,
                    fallbackThemeId: e.target.value,
                    disabledThemeIds: prev.disabledThemeIds.filter((id) => id !== e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-input-bg)] text-[var(--aegion-platform-text)] aegion-btn-shape"
              >
                {PLATFORM_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--aegion-platform-border)]">
            <label className="inline-flex items-center gap-2 text-xs text-[var(--aegion-platform-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={govDraft.animationsGloballyAllowed}
                onChange={(e) =>
                  setGovDraft((prev) => ({
                    ...prev,
                    animationsGloballyAllowed: e.target.checked,
                  }))
                }
                className="rounded"
              />
              Allow Animated Platform Themes for Users
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[var(--aegion-platform-text-muted)] mr-1">
                Categories:
              </span>
              {PLATFORM_THEME_CATEGORIES.map((cat) => {
                const disabled = govDraft.disabledCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleDisabledCategoryDraft(cat)}
                    className={`px-2 py-1 text-[11px] font-medium border cursor-pointer aegion-btn-shape ${
                      disabled
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 line-through'
                        : 'bg-[var(--aegion-platform-bg-alt)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-[var(--aegion-platform-text-muted)]">
            Tip: Click the lock button on any theme card below to toggle availability for workspace users, then press <strong>Save Governance Policy</strong>. Disabled themes fallback automatically to{' '}
            <strong>{getPlatformThemeById(govDraft.fallbackThemeId).name}</strong>.
          </p>
        </div>
      )}

      {/* Search + Category Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'All',
              ...PLATFORM_THEME_CATEGORIES,
              'Light',
              'Dark',
            ] as CategoryFilter[]
          ).map((tab) => {
            const active = categoryFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategoryFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer aegion-btn-shape ${
                  active
                    ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                    : 'bg-[var(--aegion-platform-surface-solid)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[var(--aegion-platform-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${PLATFORM_THEMES.length} platform themes...`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-input-bg)] text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
          />
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredThemes.map((theme) => {
          const isDisabled = showGovernance
            ? govDraft.disabledThemeIds.includes(theme.id) ||
              govDraft.disabledCategories.includes(theme.category)
            : isThemeDisabledForCurrentUser(theme.id);

          const defaultBadges: string[] = [];
          if (showGovernance) {
            if (govDraft.defaultPublicThemeId === theme.id) defaultBadges.push('Public Default');
            if (govDraft.defaultUserThemeId === theme.id) defaultBadges.push('User Default');
            if (govDraft.defaultAdminThemeId === theme.id) defaultBadges.push('Admin Default');
            if (govDraft.fallbackThemeId === theme.id) defaultBadges.push('Fallback');
          }

          return (
            <PlatformThemeCard
              key={theme.id}
              theme={theme}
              isActive={persistedThemeId === theme.id}
              isPreviewing={previewThemeId === theme.id}
              isDisabledForUsers={isDisabled}
              isAdminMode={showGovernance}
              defaultBadges={defaultBadges}
              onPreview={() => startPreview(theme.id)}
              onApply={() => void applyTheme(theme.id)}
              onToggleAdminDisable={
                showGovernance ? () => toggleDisabledThemeDraft(theme.id) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
};
