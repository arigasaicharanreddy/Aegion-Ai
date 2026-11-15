import React, { useState } from 'react';
import { Check, X, FileCode2, Database, ShieldCheck, Layers } from 'lucide-react';
import { ChangeProposal } from '../../types/chat';
import { Button } from '../common/Button';

interface ApprovalPanelProps {
  proposal: ChangeProposal;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  proposal,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'schema'>('overview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const activeFile = proposal.files[selectedFileIndex];

  return (
    <div className="mt-3 rounded-xl border border-[var(--aegion-platform-border-strong)] bg-[var(--aegion-platform-bg-alt)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--aegion-platform-border)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[var(--aegion-platform-accent)]">Proposed Architecture & Code Change</div>
          <div className="text-sm font-semibold text-[var(--aegion-platform-text)] mt-0.5">{proposal.summary}</div>
        </div>
        <div className="text-xs text-[var(--aegion-platform-text-muted)]">
          {proposal.detectedLanguage} / {proposal.detectedFramework} · {proposal.detectedCategory}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--aegion-platform-border)] flex items-center gap-1 bg-[var(--aegion-platform-surface-solid)]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium aegion-btn-shape whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
              : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
          }`}
        >
          Specification ({proposal.modules.length} modules)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`px-3 py-1.5 text-xs font-medium aegion-btn-shape whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'files'
              ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
              : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
          }`}
        >
          Generated Files ({proposal.files.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1.5 text-xs font-medium aegion-btn-shape whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'schema'
              ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
              : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
          }`}
        >
          Schema & APIs ({proposal.databaseSchema.length + proposal.apiDefinitions.length})
        </button>
      </div>

      <div className="p-4 text-xs">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-medium text-[var(--aegion-platform-text)]">
                <Layers className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                <span>Stack & Modules</span>
              </div>
              <div className="text-[var(--aegion-platform-text-muted)] space-y-1">
                <div>Backend: {proposal.detectedLanguage} ({proposal.detectedFramework})</div>
                <div>Frontend: {proposal.detectedFrontend}</div>
                <div>Database: {proposal.database} · Auth: {proposal.authMethod}</div>
                <div>Modules: {proposal.modules.join(' · ')}</div>
                <div>Roles: {proposal.userRoles.join(' · ')}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-medium text-[var(--aegion-platform-text)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Security & Business Rules</span>
              </div>
              <ul className="space-y-1 text-[var(--aegion-platform-text-muted)] list-disc pl-4">
                {proposal.businessRules.slice(0, 3).map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
                {proposal.securityChecklist.slice(0, 2).map((chk, i) => (
                  <li key={`sec-${i}`}>{chk}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-3">
            {proposal.files.length === 0 ? (
              <p className="text-[var(--aegion-platform-text-muted)]">No files generated in this turn.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {proposal.files.map((f, idx) => (
                    <button
                      key={f.path}
                      type="button"
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`px-2.5 py-1 aegion-btn-shape font-mono text-[11px] flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        selectedFileIndex === idx
                          ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-border-strong)] text-[var(--aegion-platform-text)]'
                          : 'bg-[var(--aegion-platform-surface-solid)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                      }`}
                    >
                      <FileCode2 className="w-3 h-3" />
                      <span className="truncate max-w-[220px]">{f.path}</span>
                    </button>
                  ))}
                </div>
                {activeFile && (
                  <div className="rounded-lg border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg)] overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-[var(--aegion-platform-border)] text-[11px] text-[var(--aegion-platform-text-muted)] flex justify-between gap-2">
                      <span className="font-mono text-[var(--aegion-platform-text)] truncate">{activeFile.path}</span>
                      <span>{activeFile.language}</span>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-[var(--aegion-platform-text-secondary)] overflow-x-auto max-h-60 leading-relaxed">
                      <code>{activeFile.content}</code>
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-medium text-[var(--aegion-platform-text)]">
                <Database className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                <span>Database Tables</span>
              </div>
              {proposal.databaseSchema.map((tbl) => (
                <div key={tbl.name} className="p-2.5 rounded-lg bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)]">
                  <div className="font-mono text-[var(--aegion-platform-text)] font-semibold">{tbl.name}</div>
                  <div className="mt-1 space-y-0.5 text-[11px] text-[var(--aegion-platform-text-muted)] font-mono">
                    {tbl.columns.map((c) => (
                      <div key={c.name}>
                        {c.name}: {c.type} {c.constraints}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="font-medium text-[var(--aegion-platform-text)]">API Endpoints</div>
              <div className="space-y-1.5">
                {proposal.apiDefinitions.map((ep, idx) => (
                  <div
                    key={`${ep.method}-${ep.path}-${idx}`}
                    className="p-2 rounded-lg bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)]"
                  >
                    <div className="font-mono text-[11px] text-[var(--aegion-platform-text)]">
                      <span className="text-[var(--aegion-platform-accent)] font-semibold">{ep.method}</span> {ep.path}
                    </div>
                    <div className="text-[11px] text-[var(--aegion-platform-text-muted)] mt-0.5">{ep.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Footer */}
      <div className="px-4 py-3 border-t border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] flex items-center justify-between gap-3">
        {proposal.status === 'pending' ? (
          <>
            <span className="text-xs text-[var(--aegion-platform-text-muted)]">
              Review generated specification before committing to Project Memory.
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onReject}>
                <X className="w-3.5 h-3.5" />
                Discard
              </Button>
              <Button type="button" size="sm" onClick={onApprove}>
                <Check className="w-3.5 h-3.5" />
                Approve & Apply
              </Button>
            </div>
          </>
        ) : proposal.status === 'approved' ? (
          <span className="text-xs text-emerald-500 font-medium">
            Approved & committed to Project Memory
          </span>
        ) : (
          <span className="text-xs text-[var(--aegion-platform-text-muted)]">Proposal discarded</span>
        )}
      </div>
    </div>
  );
};
