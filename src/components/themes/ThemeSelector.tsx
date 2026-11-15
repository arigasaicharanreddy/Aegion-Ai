import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ALL_THEMES, THEME_CATEGORIES } from '../../themes';
import { ThemeCategory, ThemeMode } from '../../types/theme';
import { ThemePreview } from './ThemePreview';

interface ThemeSelectorProps {
  selectedThemeId: string;
  initialCategory?: ThemeCategory;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedThemeId,
  initialCategory,
  onSelectTheme,
}) => {
  const [category, setCategory] = useState<ThemeCategory | 'All'>(initialCategory || 'All');
  const [mode, setMode] = useState<ThemeMode | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = ALL_THEMES.filter((t) => {
    if (category !== 'All' && t.category !== category) return false;
    if (mode !== 'all' && t.mode !== mode) return false;
    if (query.trim() && !t.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
          {(['All', ...THEME_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium aegion-btn-shape whitespace-nowrap cursor-pointer transition-colors ${
                category === cat
                  ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                  : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
            {(['all', 'light', 'dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs font-medium aegion-btn-shape whitespace-nowrap capitalize cursor-pointer transition-colors ${
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter themes..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((preset) => (
          <ThemePreview
            key={preset.id}
            preset={preset}
            selected={preset.id === selectedThemeId}
            onSelect={() => onSelectTheme(preset.id)}
          />
        ))}
      </div>
    </div>
  );
};
