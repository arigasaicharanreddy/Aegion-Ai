import React, { useState } from 'react';
import { useAegion } from '../context/AegionContext';
import { ChatWindow } from '../components/chatbot/ChatWindow';
import { PreviewPanel } from '../components/layout/PreviewPanel';
import { Modal } from '../components/common/Modal';
import { ThemeSelector } from '../components/themes/ThemeSelector';

export const BuilderPage: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    updateProjectTheme,
    notify,
  } = useAegion();
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Compact Builder Context Bar */}
      <div className="px-4 py-2 border-b border-white/10 bg-[#101116] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <label className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span>Project:</span>
            <select
              aria-label="Select active project"
              value={activeProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-[#181922] border border-white/10 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.version})
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-[#9CA3AF] hidden md:inline">
            {activeProject.category} · {activeProject.language} ({activeProject.framework})
          </span>
        </div>

        <div className="text-xs text-[#9CA3AF]">
          Modules: {activeProject.modules.slice(0, 4).join(' · ')}
        </div>
      </div>

      {/* Split Workspace: Main Chatbot + Right Live Preview Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-6 h-full min-h-[460px] border-b xl:border-b-0 xl:border-r border-white/10 flex flex-col min-h-0">
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
        title="Select Glass UI Theme Preset"
        subtitle="Themes apply purely via CSS design tokens without altering backend or business logic."
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
