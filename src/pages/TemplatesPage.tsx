import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { APPLICATION_TEMPLATES, SUPPORTED_LANGUAGES } from '../config/appConfig';
import { useAegion } from '../context/AegionContext';
import { ProgrammingLanguage } from '../types/project';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';

export const TemplatesPage: React.FC = () => {
  const { createProject, navigate } = useAegion();
  const [selectedLangs, setSelectedLangs] = useState<Record<string, ProgrammingLanguage>>({});

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">Application Templates</h1>
        <p className="text-xs text-[var(--aegion-platform-text-muted)]">
          Choose a domain blueprint and pair it with any of the 12 supported backend languages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {APPLICATION_TEMPLATES.map((tpl) => {
          const chosenLang = selectedLangs[tpl.id] || tpl.defaultLanguage;
          return (
            <GlassCard key={tpl.id} className="flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="text-xs text-[var(--aegion-platform-accent)] font-medium">{tpl.category}</div>
                <h2 className="text-lg font-semibold text-[var(--aegion-platform-text)] font-display">{tpl.title}</h2>
                <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">{tpl.summary}</p>
                <div className="text-[11px] text-[var(--aegion-platform-text-secondary)] pt-1">
                  Modules: {tpl.coreModules.join(' · ')}
                </div>
                <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">
                  Roles: {tpl.defaultRoles.join(' · ')}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--aegion-platform-border)]">
                <label className="block space-y-1">
                  <span className="text-[11px] text-[var(--aegion-platform-text-muted)]">Target Backend Stack</span>
                  <select
                    value={chosenLang}
                    onChange={(e) =>
                      setSelectedLangs((prev) => ({
                        ...prev,
                        [tpl.id]: e.target.value as ProgrammingLanguage,
                      }))
                    }
                    className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2.5 py-1.5 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.language} value={l.language}>
                        {l.language} ({l.framework})
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    createProject({
                      name: `${tpl.category} App`,
                      description: tpl.summary,
                      category: tpl.category,
                      language: chosenLang,
                      themeId: tpl.defaultThemeId,
                      initialPrompt: tpl.samplePrompt,
                    });
                    navigate('builder');
                  }}
                >
                  Instantiate in Builder
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

