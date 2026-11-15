import React, { useState } from 'react';
import { Layers, Palette, Search, Sparkles } from 'lucide-react';
import { ALL_THEMES, THEME_CATEGORIES } from '../themes';
import { useAegion } from '../context/AegionContext';
import { GlassThemePreset, ThemeCategory, ThemeMode } from '../types/theme';
import { ThemePreview } from '../components/themes/ThemePreview';
import { ThemeCustomizer } from '../components/themes/ThemeCustomizer';
import { Modal } from '../components/common/Modal';
import { PlatformThemeGallery } from '../components/platform-themes/PlatformThemeGallery';
import { PLATFORM_THEMES } from '../platform-themes/catalog';

type StudioSectionTab = 'platform' | 'generated_apps';

export const ThemeLibraryPage: React.FC = () => {
  const {
    user,
    activeProject,
    updateProjectTheme,
    themeCustomizations,
    updateThemeCustomization,
    notify,
  } = useAegion();

  const [studioTab, setStudioTab] = useState<StudioSectionTab>('platform');
  const [category, setCategory] = useState<ThemeCategory | 'All'>('All');
  const [mode, setMode] = useState<ThemeMode | 'all'>('all');
  const [search, setSearch] = useState('');
  const [customizing, setCustomizing] = useState<GlassThemePreset | null>(null);

  const filtered = ALL_THEMES.filter((t) => {
    if (category !== 'All' && t.category !== category) return false;
    if (mode !== 'all' && t.mode !== mode) return false;
    if (search.trim() && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
            Aegion Appearance &amp; Theme Studio
          </h1>
          <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
            Personalize the Aegion AI Platform interface independently from your generated business application themes.
          </p>
        </div>

        {/* Strict Separation Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
          <button
            type="button"
            onClick={() => setStudioTab('platform')}
            className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors aegion-btn-shape ${
              studioTab === 'platform'
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Themes Studio ({PLATFORM_THEMES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioTab('generated_apps')}
            className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors aegion-btn-shape ${
              studioTab === 'generated_apps'
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Generated App Themes ({ALL_THEMES.length})</span>
          </button>
        </div>
      </div>

      {studioTab === 'platform' ? (
        <PlatformThemeGallery allowAdminGovernance={user?.role === 'super_admin'} />
      ) : (
        <div className="space-y-6">
          <div className="aegion-glass p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Palette className="w-4 h-4 text-[var(--aegion-platform-accent)] shrink-0" />
              <p className="text-xs text-[var(--aegion-platform-text-secondary)]">
                50 configurable presets (5 light + 5 dark per industry category). Applying a theme updates preview CSS tokens for{' '}
                <strong className="text-[var(--aegion-platform-text)]">{activeProject.name}</strong> without altering code logic or your platform theme.
              </p>
            </div>
            <div className="text-xs text-[var(--aegion-platform-text-muted)] tabular-nums">
              Showing {filtered.length} of {ALL_THEMES.length} app presets
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
              {(['All', ...THEME_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors aegion-btn-shape ${
                    category === cat
                      ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                      : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
                {(['all', 'light', 'dark'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-xs font-medium capitalize whitespace-nowrap cursor-pointer aegion-btn-shape ${
                      mode === m
                        ? 'bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)]'
                        : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 50 presets..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((preset) => (
              <ThemePreview
                key={preset.id}
                preset={preset}
                customization={themeCustomizations[preset.id]}
                selected={activeProject.themeId === preset.id}
                onSelect={() => {
                  updateProjectTheme(activeProject.id, preset.id, themeCustomizations[preset.id]);
                  notify(`Applied ${preset.name} to ${activeProject.name}`, 'success');
                }}
                onCustomize={() => setCustomizing(preset)}
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(customizing)}
        onClose={() => setCustomizing(null)}
        title={customizing ? `Customize ${customizing.name}` : 'Customize Theme'}
        subtitle="Adjust design tokens and preview live before saving."
        maxWidth="max-w-3xl"
      >
        {customizing && (
          <ThemeCustomizer
            preset={customizing}
            initialCustomization={themeCustomizations[customizing.id]}
            onSave={(cust) => {
              updateThemeCustomization(customizing.id, cust);
              updateProjectTheme(activeProject.id, customizing.id, cust);
              notify(`Saved custom tokens for ${customizing.name}`, 'success');
            }}
            onClose={() => setCustomizing(null)}
          />
        )}
      </Modal>
    </div>
  );
};

