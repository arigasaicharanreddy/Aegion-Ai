import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ALL_THEMES, THEME_CATEGORIES } from '../themes';
import { useAegion } from '../context/AegionContext';
import { GlassThemePreset, ThemeCategory, ThemeMode } from '../types/theme';
import { ThemePreview } from '../components/themes/ThemePreview';
import { ThemeCustomizer } from '../components/themes/ThemeCustomizer';
import { Modal } from '../components/common/Modal';

export const ThemeLibraryPage: React.FC = () => {
  const {
    activeProject,
    updateProjectTheme,
    themeCustomizations,
    updateThemeCustomization,
    notify,
  } = useAegion();

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
          <h1 className="text-2xl font-bold text-white font-display">
            Aegion Glass UI Theme Library
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            50 configurable presets (5 light + 5 dark per category). Applying a theme updates CSS
            tokens for <span className="text-white">{activeProject.name}</span> without modifying code logic.
          </p>
        </div>
        <div className="text-xs text-[#9CA3AF] tabular-nums">
          Showing {filtered.length} of {ALL_THEMES.length} presets
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-lg">
          {(['All', ...THEME_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                category === cat ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-lg">
            {(['all', 'light', 'dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize whitespace-nowrap cursor-pointer ${
                  mode === m ? 'bg-white/15 text-white' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 50 presets..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#14151B] border border-white/10 rounded-lg text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
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
