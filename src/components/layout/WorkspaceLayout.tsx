import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAegion } from '../../context/AegionContext';
import { APPLICATION_TEMPLATES, SUPPORTED_LANGUAGES } from '../../config/appConfig';
import { AppCategory, ProgrammingLanguage } from '../../types/project';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const { createProject, navigate } = useAegion();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AppCategory>('HRMS');
  const [language, setLanguage] = useState<ProgrammingLanguage>('Python');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({
      name: name || `${category} Platform`,
      description,
      category,
      language,
    });
    setName('');
    setDescription('');
    setNewProjectOpen(false);
    navigate('builder');
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#09090C] text-[#F3F4F6]">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenNewProject={() => setNewProjectOpen(true)}
        />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>

      <Modal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        title="Create Application Project"
        subtitle="Select a domain template and target backend language. Default backend stack is Python + FastAPI."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#D1D5DB]">Project Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Horizon Workforce HRMS"
              className="w-full bg-[#1C1E26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#D1D5DB]">Application Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppCategory)}
                className="w-full bg-[#1C1E26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                {APPLICATION_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.category}>
                    {t.category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#D1D5DB]">Target Backend Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                className="w-full bg-[#1C1E26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.language} value={l.language}>
                    {l.language} ({l.framework})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#D1D5DB]">Business Requirements Summary</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional initial domain notes, user roles, or compliance rules..."
              className="w-full bg-[#1C1E26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create & Open Builder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
