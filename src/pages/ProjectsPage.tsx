import React, { useState } from 'react';
import { Copy, Download, Share2, RotateCcw, UserPlus, ExternalLink } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { exportProjectZip } from '../services/projectService';
import { Project } from '../types/project';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    setActiveProjectId,
    navigate,
    cloneProject,
    toggleShareProject,
    inviteCollaborator,
    rollbackProjectVersion,
    notify,
  } = useAegion();

  const [search, setSearch] = useState('');
  const [inspectProject, setInspectProject] = useState<Project | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Editor' | 'Viewer'>('Editor');

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.language.toLowerCase().includes(search.toLowerCase())
  );

  const liveInspect = inspectProject
    ? projects.find((p) => p.id === inspectProject.id) || inspectProject
    : null;

  const columns: ColumnDef<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <div>
          <div className="font-medium text-[var(--aegion-platform-text)]">{p.name}</div>
          <div className="text-xs text-[var(--aegion-platform-text-muted)]">{p.category}</div>
        </div>
      ),
    },
    {
      key: 'stack',
      header: 'Backend Stack',
      render: (p) => (
        <span className="text-xs text-[var(--aegion-platform-text-secondary)]">
          {p.language} / {p.framework}
        </span>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (p) => (
        <span className="font-mono text-xs text-[var(--aegion-platform-accent)] tabular-nums">
          {p.version}
        </span>
      ),
    },
    {
      key: 'modules',
      header: 'Modules',
      align: 'right',
      render: (p) => (
        <span className="tabular-nums text-xs text-[var(--aegion-platform-text-secondary)]">
          {p.modules.length}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div
          className="inline-flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveProjectId(p.id);
              navigate('builder');
            }}
          >
            Builder
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => cloneProject(p.id)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exportProjectZip(p)}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setInspectProject(p)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspect || !inviteEmail.trim()) return;
    inviteCollaborator(liveInspect.id, inviteName || inviteEmail.split('@')[0], inviteEmail, inviteRole);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aegion-platform-text)] font-display">
            Projects &amp; Version History
          </h1>
          <p className="text-xs text-[var(--aegion-platform-text-muted)] mt-1">
            Inspect Project Memory, roll back approved versions, share read-only previews, or export ZIP archives.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects, category, or language..."
          className="w-full sm:w-72 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3.5 py-2 text-xs text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)] aegion-btn-shape"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        onRowClick={(p) => setInspectProject(p)}
        emptyTitle="No matching projects found."
      />

      <Modal
        open={Boolean(liveInspect)}
        onClose={() => setInspectProject(null)}
        title={liveInspect?.name || ''}
        subtitle={
          liveInspect
            ? `${liveInspect.category} · ${liveInspect.language} (${liveInspect.framework}) · ${liveInspect.version}`
            : ''
        }
        maxWidth="max-w-4xl"
      >
        {liveInspect && (
          <div className="space-y-6 text-xs">
            {/* Share & Export */}
            <div className="p-4 rounded-xl bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[var(--aegion-platform-text)]">Read-Only Preview Sharing</div>
                <div className="text-[var(--aegion-platform-text-muted)] mt-0.5">
                  {liveInspect.shareEnabled
                    ? `Enabled · Token ${liveInspect.shareToken}`
                    : 'Private to workspace collaborators'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleShareProject(liveInspect.id)}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {liveInspect.shareEnabled ? 'Disable Link' : 'Enable Link'}
                </Button>
                {liveInspect.shareEnabled && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/?share=${liveInspect.shareToken}`;
                      navigator.clipboard?.writeText(url);
                      notify('Copied read-only share URL', 'success');
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Copy Share URL
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => exportProjectZip(liveInspect)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export ZIP
                </Button>
              </div>
            </div>

            {/* Version History with Rollback */}
            <div className="space-y-2.5">
              <div className="font-semibold text-[var(--aegion-platform-text)] text-sm font-display">
                Version Snapshots
              </div>
              <div className="divide-y divide-[var(--aegion-platform-border)] border border-[var(--aegion-platform-border)] rounded-xl bg-[var(--aegion-platform-bg-alt)]">
                {liveInspect.versions
                  .slice()
                  .reverse()
                  .map((v) => (
                    <div key={v.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[var(--aegion-platform-text)] font-medium">
                          <span className="font-mono text-[var(--aegion-platform-accent)] mr-2">{v.version}</span>
                          {v.changeSummary}
                        </div>
                        <div className="text-[var(--aegion-platform-text-muted)] mt-0.5">
                          {v.author} · {new Date(v.createdAt).toLocaleString()} · {v.language}
                        </div>
                      </div>
                      {v.version !== liveInspect.version ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => rollbackProjectVersion(liveInspect.id, v.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Roll Back
                        </Button>
                      ) : (
                        <span className="text-emerald-400 font-medium">Current Active</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Collaborators */}
            <div className="space-y-3">
              <div className="font-semibold text-[var(--aegion-platform-text)] text-sm font-display">Collaborators</div>
              <div className="divide-y divide-[var(--aegion-platform-border)] border border-[var(--aegion-platform-border)] rounded-xl bg-[var(--aegion-platform-bg-alt)]">
                {liveInspect.collaborators.map((c) => (
                  <div key={c.id} className="px-3.5 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--aegion-platform-text)] font-medium">{c.name}</span>
                      <span className="text-[var(--aegion-platform-text-muted)] ml-2">{c.email}</span>
                    </div>
                    <span className="text-[var(--aegion-platform-accent)] font-medium">{c.role}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Collaborator name"
                  className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-1.5 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 min-w-[180px] bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-3 py-1.5 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Editor' | 'Viewer')}
                  className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] px-2.5 py-1.5 text-xs text-[var(--aegion-platform-text)] aegion-btn-shape"
                >
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <Button type="submit" size="sm">
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </Button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

