import React from 'react';
import { ArrowRight, Download, Copy, Share2, Sparkles } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { usePlatformTheme } from '../context/PlatformThemeContext';
import { getThemeById } from '../themes';
import { exportProjectZip } from '../services/projectService';
import { APPLICATION_TEMPLATES } from '../config/appConfig';
import { Button } from '../components/common/Button';
import { GlassCard } from '../components/common/GlassCard';

export const DashboardPage: React.FC = () => {
  const {
    activeProject,
    projects,
    setActiveProjectId,
    navigate,
    cloneProject,
    toggleShareProject,
    createProject,
    notify,
  } = useAegion();
  const { activeTheme } = usePlatformTheme();

  const theme = getThemeById(activeProject.themeId);

  const handleShareCopy = () => {
    if (!activeProject.shareEnabled) {
      toggleShareProject(activeProject.id);
    }
    const url = `${window.location.origin}/?share=${activeProject.shareToken}`;
    navigator.clipboard?.writeText(url);
    notify('Copied read-only preview link to clipboard', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Top Active Project Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
            {activeProject.name}
          </h1>
          <p className="text-xs text-[var(--aegion-platform-text-muted)]">
            {activeProject.category} · {activeProject.version} · {activeProject.language} ({activeProject.framework}) · App Theme: {theme.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('themes')}>
            <Sparkles className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
            Platform Theme ({activeTheme.name})
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => cloneProject(activeProject.id)}>
            <Copy className="w-3.5 h-3.5" />
            Clone
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleShareCopy}>
            <Share2 className="w-3.5 h-3.5" />
            Share Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => exportProjectZip(activeProject)}
          >
            <Download className="w-3.5 h-3.5" />
            Download ZIP
          </Button>
          <Button type="button" size="sm" onClick={() => navigate('builder')}>
            Open AI Builder
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 4-column Key Project Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Workspace Projects</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {projects.length}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Active Modules</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {activeProject.modules.length}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Committed Versions</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {activeProject.versions.length}
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">Generated Files</div>
          <div className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display tabular-nums mt-1">
            {activeProject.files.length}
          </div>
        </GlassCard>
      </div>

      {/* Middle Split: Modules & Recent Versions + Project Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--aegion-platform-border)]">
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">
                Active Project Modules &amp; Version History
              </h2>
              <button
                type="button"
                onClick={() => navigate('projects')}
                className="text-xs text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
              >
                Manage Versions
              </button>
            </div>

            <div className="py-4 border-b border-[var(--aegion-platform-border)] space-y-2">
              <div className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Generated Modules</div>
              <div className="text-xs text-[var(--aegion-platform-text-muted)]">{activeProject.modules.join(' · ')}</div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">Recent Approved Changes</div>
              {activeProject.versions
                .slice()
                .reverse()
                .slice(0, 4)
                .map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-start justify-between gap-3 text-xs py-2 border-b border-[var(--aegion-platform-border)] last:border-b-0"
                  >
                    <div>
                      <div className="text-[var(--aegion-platform-text)] font-medium">{ver.changeSummary}</div>
                      <div className="text-[var(--aegion-platform-text-muted)] mt-0.5">
                        {ver.author} · {ver.language} ({ver.framework})
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-[var(--aegion-platform-accent)] shrink-0">
                      {ver.version}
                    </span>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--aegion-platform-border)]">
              <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">Recent Projects</h2>
              <button
                type="button"
                onClick={() => navigate('projects')}
                className="text-xs text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
              >
                All Projects
              </button>
            </div>
            <div className="divide-y divide-[var(--aegion-platform-border)]">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    navigate('builder');
                  }}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--aegion-platform-accent-soft)] px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--aegion-platform-text)] truncate">{proj.name}</div>
                    <div className="text-xs text-[var(--aegion-platform-text-muted)] truncate">
                      {proj.category} · {proj.language} · {proj.version}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--aegion-platform-accent)] shrink-0 font-medium">Open</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick-Start Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--aegion-platform-text)] font-display">Quick-Start Blueprints</h2>
          <button
            type="button"
            onClick={() => navigate('templates')}
            className="text-xs text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
          >
            Browse All 6 Categories
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPLICATION_TEMPLATES.slice(0, 3).map((tpl) => (
            <GlassCard key={tpl.id} padding="sm" className="flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-[var(--aegion-platform-accent)] font-medium">
                  {tpl.category} · {tpl.defaultLanguage}
                </div>
                <div className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">{tpl.title}</div>
                <p className="text-xs text-[var(--aegion-platform-text-muted)] line-clamp-2">{tpl.summary}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  createProject({
                    name: `${tpl.category} New Build`,
                    description: tpl.summary,
                    category: tpl.category,
                    language: tpl.defaultLanguage,
                    themeId: tpl.defaultThemeId,
                    initialPrompt: tpl.samplePrompt,
                  });
                  navigate('builder');
                }}
              >
                Use Blueprint
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

