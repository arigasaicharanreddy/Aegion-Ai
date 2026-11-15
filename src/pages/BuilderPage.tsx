import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { ChatWindow } from '../components/chatbot/ChatWindow';
import { PreviewPanel } from '../components/layout/PreviewPanel';
import { Modal } from '../components/common/Modal';
import { ThemeSelector } from '../components/themes/ThemeSelector';
import { BuilderArchitectureBlueprint } from '../components/theme-3d/BuilderArchitectureBlueprint';

export const BuilderPage: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    updateProjectTheme,
    notify,
  } = useAegion();
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Compact Builder Context Bar */}
      <div className="px-4 py-2 border-b border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <label className="flex items-center gap-2 text-xs text-[var(--aegion-platform-text-muted)]">
            <span>Project:</span>
            <select
              aria-label="Select active project"
              value={activeProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2.5 py-1 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.version})
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-[var(--aegion-platform-text-muted)] hidden md:inline">
            {activeProject.category} · {activeProject.language} ({activeProject.framework})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--aegion-platform-text-muted)] hidden sm:inline">
            Modules: {activeProject.modules.slice(0, 4).join(' · ')}
          </span>
          <button
            type="button"
            onClick={() => setShowArchitecture((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer transition-colors aegion-btn-shape ${
              showArchitecture
                ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-accent)] text-[var(--aegion-platform-text)]'
                : 'bg-[var(--aegion-platform-surface-solid)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
            <span>{showArchitecture ? 'Hide Architecture' : 'Architecture Blueprint'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Architecture Topology */}
      {showArchitecture && (
        <div className="p-3 border-b border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg)] shrink-0">
          <BuilderArchitectureBlueprint
            projectName={activeProject.name}
            modules={activeProject.modules}
            tableCount={activeProject.memory.databaseSchema.length || 4}
            endpointCount={activeProject.memory.apiDefinitions.length || 6}
          />
        </div>
      )}

      {/* Split Workspace: Main Chatbot + Right Live Preview Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-6 h-full min-h-[460px] border-b xl:border-b-0 xl:border-r border-[var(--aegion-platform-border)] flex flex-col min-h-0">
          <ChatWindow onOpenThemePicker={() => setThemeModalOpen(true)} />
        </div>

        <div className="xl:col-span-6 h-full min-h-[460px] flex flex-col min-h-0">
          <PreviewPanel
            project={activeProject}
            onOpenThemePicker={() => setThemeModalOpen(true)}
          />
        </div>
      </div>

      <Modal
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        title="Select Generated App Glass UI Theme"
        subtitle="Themes apply purely via preview CSS design tokens without altering backend code or your platform theme."
        maxWidth="max-w-5xl"
      >
        <ThemeSelector
          selectedThemeId={activeProject.themeId}
          initialCategory={activeProject.themeCategory}
          onSelectTheme={(themeId) => {
            updateProjectTheme(activeProject.id, themeId);
            setThemeModalOpen(false);
            notify('Applied Glass UI theme tokens to project preview', 'success');
          }}
        />
      </Modal>
    </div>
  );
};

