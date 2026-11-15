import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Maximize2,
  FileCode2,
  Database,
  Eye,
  Palette,
} from 'lucide-react';
import { Project } from '../../types/project';
import { getThemeById } from '../../themes';
import { resolveThemeVariables } from '../../themes/themeTokens';
import { Modal } from '../common/Modal';

interface PreviewPanelProps {
  project: Project;
  onOpenThemePicker?: () => void;
  readOnly?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  project,
  onOpenThemePicker,
  readOnly = false,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [tab, setTab] = useState<'preview' | 'code' | 'memory'>('preview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [activeSubPage, setActiveSubPage] = useState<string>('overview');

  const preset = getThemeById(project.themeId);
  const cssVars = resolveThemeVariables(preset, project.themeCustomization);

  const widthClass =
    viewport === 'desktop'
      ? 'w-full'
      : viewport === 'tablet'
      ? 'w-[768px] max-w-full'
      : 'w-[390px] max-w-full';

  const renderDomainPreview = () => {
    const modules = project.modules.length > 0 ? project.modules : ['Overview', 'Operations', 'Reports'];
    const currentTab = modules.includes(activeSubPage) ? activeSubPage : modules[0];

    const categoryRows: Record<string, { col1: string; col2: string; col3: string; rows: string[][] }> = {
      HRMS: {
        col1: 'Employee',
        col2: 'Department',
        col3: 'Payroll Status',
        rows: [
          ['Ananya Rao', 'Platform Engineering', 'Verified'],
          ['Daniel Cho', 'Product Architecture', 'Verified'],
          ['Sonia Patel', 'People Operations', 'Pending Leave'],
          ['Marcus Vance', 'Security & Compliance', 'Verified'],
        ],
      },
      'E-Commerce': {
        col1: 'Order ID',
        col2: 'Customer',
        col3: 'Total',
        rows: [
          ['#ORD-8841', 'Clara Lindqvist', '$248.00'],
          ['#ORD-8840', 'Kenji Takahashi', '$119.50'],
          ['#ORD-8839', 'Nadia Okafor', '$492.00'],
          ['#ORD-8838', 'Liam Mercer', '$84.00'],
        ],
      },
      'Multi-Store Management': {
        col1: 'Branch',
        col2: 'POS Terminals',
        col3: 'Daily Net',
        rows: [
          ['Austin Flagship', '8 Online', '$14,820'],
          ['Seattle Ballard', '6 Online', '$11,240'],
          ['Denver RiNo', '5 Online', '$9,615'],
          ['Chicago Fulton', '7 Online', '$13,105'],
        ],
      },
      'Healthcare Store Management': {
        col1: 'Medication Batch',
        col2: 'Lot / Expiry',
        col3: 'Stock State',
        rows: [
          ['Amoxicillin 500mg', 'LOT-419 · 2027-04', 'FEFO Ready'],
          ['Insulin Glargine', 'LOT-902 · 2026-12', 'Cold-Chain OK'],
          ['Atorvastatin 20mg', 'LOT-311 · 2027-09', 'FEFO Ready'],
          ['Metformin XR', 'LOT-118 · 2026-11', 'Expiring Soon'],
        ],
      },
      'SaaS Applications': {
        col1: 'Tenant Workspace',
        col2: 'API Calls (24h)',
        col3: 'Tier',
        rows: [
          ['Northstar Bio', '412,900', 'Enterprise'],
          ['Helios Freight', '184,210', 'Growth'],
          ['Kiteworks Studio', '92,450', 'Scale'],
          ['Veridian Labs', '610,120', 'Enterprise'],
        ],
      },
      'Custom Business Applications': {
        col1: 'Record',
        col2: 'Owner',
        col3: 'Workflow State',
        rows: [
          ['REQ-4012', 'Operations Lead', 'Approved'],
          ['REQ-4011', 'Procurement', 'In Review'],
          ['REQ-4010', 'Finance Control', 'Approved'],
          ['REQ-4009', 'Compliance', 'Settled'],
        ],
      },
    };

    const tableData = categoryRows[project.category] || categoryRows['SaaS Applications'];

    return (
      <div
        key={refreshKey}
        style={{
          ...(cssVars as React.CSSProperties),
          backgroundColor: 'var(--preview-bg)',
          color: 'var(--preview-text)',
          fontFamily: 'var(--preview-font-body)',
        }}
        className="h-full w-full p-4 sm:p-5 overflow-y-auto relative transition-all duration-200"
      >
        <div
          style={{
            background: `radial-gradient(circle at 90% 8%, color-mix(in srgb, var(--preview-accent) 18%, transparent), transparent 55%)`,
          }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="relative z-10 space-y-4">
          {/* Generated App Top Bar */}
          <div
            style={{ borderRadius: 'var(--preview-radius)' }}
            className="preview-glass-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div
                style={{ fontFamily: 'var(--preview-font-display)' }}
                className="text-sm font-bold tracking-tight"
              >
                {project.name}
              </div>
              <div style={{ color: 'var(--preview-text-muted)' }} className="text-[11px]">
                {project.language} / {project.framework} · {project.frontendFramework}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {modules.slice(0, 4).map((mod) => {
                const isSelected = currentTab === mod;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setActiveSubPage(mod)}
                    style={{
                      backgroundColor: isSelected ? 'var(--preview-accent)' : 'transparent',
                      color: isSelected ? 'var(--preview-accent-fg)' : 'var(--preview-text-muted)',
                      borderRadius: 'calc(var(--preview-radius) * 0.6)',
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: `${currentTab} Records`, value: '1,284' },
              { label: 'Active Roles', value: String(project.memory.userRoles.length || 4) },
              { label: 'API Endpoints', value: String(project.memory.apiDefinitions.length || 6) },
            ].map((stat) => (
              <div key={stat.label} className="preview-glass-surface p-3.5">
                <div style={{ color: 'var(--preview-text-muted)' }} className="text-[11px]">
                  {stat.label}
                </div>
                <div
                  style={{ fontFamily: 'var(--preview-font-display)' }}
                  className="text-lg font-bold tabular-nums mt-1"
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Generated Module Data Grid */}
          <div className="preview-glass-surface overflow-hidden">
            <div
              style={{ borderColor: 'var(--preview-border)' }}
              className="px-4 py-3 border-b flex items-center justify-between gap-2"
            >
              <span
                style={{ fontFamily: 'var(--preview-font-display)' }}
                className="text-xs font-semibold"
              >
                {currentTab} · {project.category}
              </span>
              <span
                style={{
                  backgroundColor: 'var(--preview-accent)',
                  color: 'var(--preview-accent-fg)',
                  borderRadius: 'calc(var(--preview-radius) * 0.55)',
                }}
                className="px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
              >
                New Entry
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    style={{
                      color: 'var(--preview-text-muted)',
                      borderColor: 'var(--preview-border)',
                    }}
                    className="border-b"
                  >
                    <th className="py-2.5 px-4 font-medium">{tableData.col1}</th>
                    <th className="py-2.5 px-4 font-medium">{tableData.col2}</th>
                    <th className="py-2.5 px-4 font-medium text-right">{tableData.col3}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{ borderColor: 'var(--preview-border)' }}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2.5 px-4 font-medium">{row[0]}</td>
                      <td style={{ color: 'var(--preview-text-muted)' }} className="py-2.5 px-4">
                        {row[1]}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">
                        {row[2]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decoupled Theme Token Caption */}
          <div style={{ color: 'var(--preview-text-muted)' }} className="text-[11px] flex items-center justify-between">
            <span>
              Theme: {preset.name} ({preset.mode})
            </span>
            <span>Version {project.version}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPanelContent = () => (
    <div className="flex flex-col h-full min-h-0 bg-[var(--aegion-platform-bg)]">
      {/* Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-[var(--aegion-platform-border)] flex flex-wrap items-center justify-between gap-2 bg-[var(--aegion-platform-bg-alt)]">
        <div className="flex items-center gap-1 p-0.5 bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)] aegion-btn-shape">
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 aegion-btn-shape text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              tab === 'preview'
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`px-2.5 py-1 aegion-btn-shape text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              tab === 'code'
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Code ({project.files.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('memory')}
            className={`px-2.5 py-1 aegion-btn-shape text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              tab === 'memory'
                ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {!readOnly && onOpenThemePicker && (
            <button
              type="button"
              onClick={onOpenThemePicker}
              title="Switch Generated App Glass UI theme"
              className="p-1.5 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-cement)] cursor-pointer transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-0.5 bg-[var(--aegion-platform-surface-solid)] border border-[var(--aegion-platform-border)] aegion-btn-shape p-0.5">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop viewport"
              className={`p-1 rounded cursor-pointer transition-colors ${
                viewport === 'desktop'
                  ? 'bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)]'
                  : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet viewport"
              className={`p-1 rounded cursor-pointer transition-colors ${
                viewport === 'tablet'
                  ? 'bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)]'
                  : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile viewport"
              className={`p-1 rounded cursor-pointer transition-colors ${
                viewport === 'mobile'
                  ? 'bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)]'
                  : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh preview"
            className="p-1.5 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-cement)] cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {!fullscreen && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              title="Open expanded preview"
              className="p-1.5 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-cement)] cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Body */}
      <div className="flex-1 overflow-auto p-3 flex justify-center min-h-0">
        {tab === 'preview' && (
          <div
            className={`${widthClass} h-full rounded-xl overflow-hidden border border-[var(--aegion-platform-border)] transition-all duration-200`}
          >
            {renderDomainPreview()}
          </div>
        )}

        {tab === 'code' && (
          <div className="w-full space-y-3">
            {project.files.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--aegion-platform-text-muted)] border border-[var(--aegion-platform-border)] rounded-xl bg-[var(--aegion-platform-surface-solid)]">
                No source files committed yet. Send a prompt in the AI Builder and approve a proposal.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {project.files.map((file, idx) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedFileIdx(idx)}
                      className={`px-2.5 py-1 aegion-btn-shape font-mono text-[11px] border cursor-pointer transition-colors ${
                        selectedFileIdx === idx
                          ? 'bg-[var(--aegion-platform-accent-soft)] border-[var(--aegion-platform-border-strong)] text-[var(--aegion-platform-text)]'
                          : 'bg-[var(--aegion-platform-surface-solid)] border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)]'
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>
                {project.files[selectedFileIdx] && (
                  <div className="rounded-xl border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] overflow-hidden">
                    <div className="px-3.5 py-2 border-b border-[var(--aegion-platform-border)] flex justify-between text-[11px] text-[var(--aegion-platform-text-muted)]">
                      <span className="font-mono text-[var(--aegion-platform-text)]">
                        {project.files[selectedFileIdx].path}
                      </span>
                      <span>{project.files[selectedFileIdx].summary}</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[var(--aegion-platform-text-secondary)] overflow-x-auto leading-relaxed">
                      <code>{project.files[selectedFileIdx].content}</code>
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div className="w-full space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] space-y-2">
              <div className="font-semibold text-[var(--aegion-platform-text)]">Project Specification</div>
              <p className="text-[var(--aegion-platform-text-muted)] leading-relaxed">{project.memory.specification}</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] space-y-2">
              <div className="font-semibold text-[var(--aegion-platform-text)]">User Roles & Business Rules</div>
              <div className="text-[var(--aegion-platform-text-secondary)]">Roles: {project.memory.userRoles.join(' · ')}</div>
              <ul className="list-disc pl-4 space-y-1 text-[var(--aegion-platform-text-muted)]">
                {project.memory.businessRules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] space-y-2">
              <div className="font-semibold text-[var(--aegion-platform-text)]">Prompt History</div>
              <ul className="space-y-1.5 text-[var(--aegion-platform-text-muted)]">
                {project.memory.promptHistory.map((ph, i) => (
                  <li key={i} className="font-mono text-[11px] bg-[var(--aegion-platform-bg-alt)] p-2 rounded border border-[var(--aegion-platform-border)]">
                    {ph}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderPanelContent()}
      <Modal
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={`${project.name} — Live Preview`}
        subtitle={`${project.category} · ${project.language} (${project.framework}) · Theme: ${preset.name}`}
        maxWidth="max-w-6xl"
      >
        <div className="h-[72vh] rounded-xl overflow-hidden border border-[var(--aegion-platform-border)]">
          {renderDomainPreview()}
        </div>
      </Modal>
    </>
  );
};
