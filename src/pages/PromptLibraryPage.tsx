import React, { useState } from 'react';
import { Lock, Check, Plus, GitCompare } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { PROMPT_LAYERS, SUPPORTED_LANGUAGES, APPLICATION_TEMPLATES } from '../config/appConfig';
import { canUserAccessPromptContent, checkPromptMutationPermission } from '../services/promptService';
import { PromptEntry, PromptLayer } from '../types/prompt';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const PromptLibraryPage: React.FC = () => {
  const {
    prompts,
    user,
    savePromptDraft,
    approvePromptVersion,
    createPrompt,
    recordAudit,
    notify,
  } = useAegion();

  const [layerFilter, setLayerFilter] = useState<PromptLayer | 'All'>('All');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [draftChangeDesc, setDraftChangeDesc] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLayer, setNewLayer] = useState<PromptLayer>('Module Prompts');
  const [newLang, setNewLang] = useState<string>('Python');
  const [newAppType, setNewAppType] = useState<string>('HRMS');
  const [newModule, setNewModule] = useState('');
  const [newContent, setNewContent] = useState('');

  const role = user?.role || 'builder';
  const filtered = prompts.filter((p) => layerFilter === 'All' || p.layer === layerFilter);

  const openInspector = (entry: PromptEntry) => {
    setSelectedPrompt(entry);
    setDraftContent(entry.content);
    setDraftChangeDesc(entry.changeDescription);
    setShowDiff(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedPrompt) return;
    const perm = await checkPromptMutationPermission(role, 'edit', selectedPrompt);
    if (!perm.allowed) {
      recordAudit('EDIT_PROTECTED_PROMPT', selectedPrompt.id, 'Denied');
      notify(perm.reason || 'Permission denied by backend authorization', 'error');
      return;
    }
    savePromptDraft(selectedPrompt.id, draftContent, draftChangeDesc);
    setSelectedPrompt(null);
  };

  const handleApprove = async () => {
    if (!selectedPrompt) return;
    const perm = await checkPromptMutationPermission(role, 'approve', selectedPrompt);
    if (!perm.allowed) {
      recordAudit('APPROVE_PROMPT_VERSION', selectedPrompt.id, 'Denied');
      notify(perm.reason || 'Super Admin required for prompt approval', 'error');
      return;
    }
    approvePromptVersion(selectedPrompt.id, draftChangeDesc || 'Approved in Prompt Registry');
    setSelectedPrompt(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPrompt({
      name: newName,
      layer: newLayer,
      language: newLang as PromptEntry['language'],
      applicationType: newAppType as PromptEntry['applicationType'],
      module: newModule || 'Core',
      version: 'v1.0.0',
      status: 'Draft',
      protected: newLayer === 'Platform Core Prompts' || newLayer === 'Security Prompts',
      author: user?.name || 'Builder',
      changeDescription: 'Initial prompt pack draft',
      content: newContent,
    });
    setCreateOpen(false);
    setNewName('');
    setNewContent('');
  };

  const columns: ColumnDef<PromptEntry>[] = [
    {
      key: 'id',
      header: 'Prompt ID',
      render: (p) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#A78BFA]">
          {p.protected && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
          <span>{p.id}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name & Layer',
      render: (p) => (
        <div>
          <div className="font-medium text-white">{p.name}</div>
          <div className="text-xs text-[#9CA3AF]">{p.layer}</div>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Language / App',
      render: (p) => (
        <span className="text-xs text-[#D1D5DB]">
          {p.language} · {p.applicationType}
        </span>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (p) => <span className="font-mono text-xs tabular-nums text-[#E5E7EB]">{p.version}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span
          className={`text-xs font-medium ${
            p.status === 'Approved'
              ? 'text-emerald-400'
              : p.status === 'Pending Review'
              ? 'text-amber-300'
              : 'text-[#9CA3AF]'
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Inspect',
      align: 'right',
      render: (p) => (
        <Button type="button" variant="secondary" size="sm" onClick={() => openInspector(p)}>
          View / Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Prompt Registry</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            9-layer prompt architecture with version comparison, draft editing, and server-enforced RBAC on protected Core & Security layers.
          </p>
        </div>

        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          New Prompt Pack
        </Button>
      </div>

      {/* Layer Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-lg">
        <button
          type="button"
          onClick={() => setLayerFilter('All')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
            layerFilter === 'All' ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          All Layers ({prompts.length})
        </button>
        {PROMPT_LAYERS.map((layer) => (
          <button
            key={layer}
            type="button"
            onClick={() => setLayerFilter(layer)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
              layerFilter === layer ? 'bg-[#7C3AED] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {layer.replace(' Prompts', '')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        onRowClick={openInspector}
      />

      {/* Inspector & Diff Modal */}
      <Modal
        open={Boolean(selectedPrompt)}
        onClose={() => setSelectedPrompt(null)}
        title={selectedPrompt ? `${selectedPrompt.id} — ${selectedPrompt.name}` : ''}
        subtitle={
          selectedPrompt
            ? `${selectedPrompt.layer} · ${selectedPrompt.version} · Author: ${selectedPrompt.author}`
            : ''
        }
        maxWidth="max-w-3xl"
      >
        {selectedPrompt && (
          <div className="space-y-4 text-xs">
            {!canUserAccessPromptContent(selectedPrompt, role) ? (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Protected Platform Prompt</span>
                </div>
                <p>
                  Platform Core Prompts and Security Prompts are protected by backend authorization.
                  Regular builder accounts cannot inspect or mutate system-level guardrails.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">
                    Status: <strong className="text-white">{selectedPrompt.status}</strong> · Scope:{' '}
                    {selectedPrompt.language} / {selectedPrompt.applicationType}
                  </span>
                  {selectedPrompt.previousContent && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDiff((d) => !d)}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      {showDiff ? 'Edit Draft' : `Compare vs ${selectedPrompt.previousVersion || 'Prev'}`}
                    </Button>
                  )}
                </div>

                {showDiff && selectedPrompt.previousContent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1.5">
                      <div className="font-mono text-[11px] text-red-300">
                        Previous ({selectedPrompt.previousVersion || 'v1.0.0'})
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#D1D5DB]">
                        {selectedPrompt.previousContent}
                      </pre>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                      <div className="font-mono text-[11px] text-emerald-300">
                        Current ({selectedPrompt.version})
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#D1D5DB]">
                        {draftContent}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block space-y-1.5">
                      <span className="text-[#D1D5DB] font-medium">Prompt Instructions</span>
                      <textarea
                        rows={6}
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="w-full font-mono text-xs bg-[#0B0C10] border border-white/10 rounded-lg p-3 text-[#E5E7EB] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[#D1D5DB] font-medium">Change Description</span>
                      <input
                        type="text"
                        value={draftChangeDesc}
                        onChange={(e) => setDraftChangeDesc(e.target.value)}
                        className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </label>
                  </div>
                )}

                {selectedPrompt.approvalHistory.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="font-medium text-white">Approval History</div>
                    {selectedPrompt.approvalHistory.map((h, i) => (
                      <div key={i} className="text-[#9CA3AF] flex justify-between gap-2">
                        <span>
                          {h.version} · {h.note} ({h.approvedBy})
                        </span>
                        <span className="tabular-nums">
                          {new Date(h.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraft}>
                    Save Draft Version
                  </Button>
                  <Button type="button" size="sm" onClick={handleApprove}>
                    <Check className="w-3.5 h-3.5" />
                    Approve Version
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* New Prompt Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Prompt Pack"
        subtitle="Add a language, module, or project prompt layer to the registry."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <label className="block space-y-1.5">
            <span className="text-[#D1D5DB] font-medium">Prompt Name</span>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Rust Axum SQLx Repository Pack"
              className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-[#D1D5DB] font-medium">Layer</span>
              <select
                value={newLayer}
                onChange={(e) => setNewLayer(e.target.value as PromptLayer)}
                className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                {PROMPT_LAYERS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[#D1D5DB] font-medium">Language</span>
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="All">All</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.language} value={l.language}>
                    {l.language}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-[#D1D5DB] font-medium">Application Type</span>
              <select
                value={newAppType}
                onChange={(e) => setNewAppType(e.target.value)}
                className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="All">All</option>
                {APPLICATION_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.category}>
                    {t.category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[#D1D5DB] font-medium">Module</span>
              <input
                type="text"
                value={newModule}
                onChange={(e) => setNewModule(e.target.value)}
                placeholder="e.g. Payroll / Backend"
                className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[#D1D5DB] font-medium">Prompt Content</span>
            <textarea
              rows={4}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full font-mono bg-[#0B0C10] border border-white/10 rounded-lg p-3 text-white"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save to Registry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
