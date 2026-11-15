import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Layers,
  Lock,
  Palette,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { usePlatformTheme } from '../../context/PlatformThemeContext';

interface ArchitectureStage {
  id: 'intake' | 'orchestration' | 'solutions';
  step: string;
  label: string;
  title: string;
  summary: string;
  items: string[];
  icon: React.ReactNode;
}

const STAGES: ArchitectureStage[] = [
  {
    id: 'intake',
    step: '01',
    label: 'Business Intake',
    title: 'Plain-Language Operational Specification',
    summary:
      'Capture roles, approval chains, compliance constraints, and domain goals cleanly before generation.',
    items: ['6-Step Governance Intake', 'Role & Permission Policies', 'Custom Business Workflows'],
    icon: <Workflow className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
  },
  {
    id: 'orchestration',
    step: '02',
    label: 'Aegion AI Core',
    title: 'Context-Aware Application Architecture Engine',
    summary:
      'Maintains structured project memory across iterations with instant snapshots and isolated token themes.',
    items: ['Persistent Context Memory', 'Version Snapshots & Rollback', '10 Platform · 50 App Themes'],
    icon: <Cpu className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
  },
  {
    id: 'solutions',
    step: '03',
    label: 'Delivery Suite',
    title: 'Tailored Enterprise Software Packages',
    summary:
      'Launch approved workspaces across core business verticals with complete export ownership.',
    items: ['HRMS & E-Commerce', 'Multi-Store & Healthcare', 'SaaS Multi-Tenant Suites'],
    icon: <Layers className="w-4 h-4 text-[var(--aegion-platform-accent)]" />,
  },
];

export const HeroArchitectureShowcase: React.FC = () => {
  const { activeTheme } = usePlatformTheme();
  const [selectedId, setSelectedId] = useState<ArchitectureStage['id']>('orchestration');
  const activeStage = STAGES.find((s) => s.id === selectedId) || STAGES[1];

  return (
    <div
      className="h-full aegion-glass p-5 sm:p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
      style={{
        borderColor: 'var(--aegion-platform-border-strong)',
      }}
    >
      {/* Subtle Internal Theme Sheen (Pure CSS, Zero Canvas/WebGL overhead) */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-65"
        style={{
          background:
            'radial-gradient(circle, var(--aegion-platform-mesh-primary) 0%, transparent 72%)',
        }}
      />

      {/* Top Metadata Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[var(--aegion-platform-border)]">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 flex items-center justify-center border border-[var(--aegion-platform-border-strong)] bg-[var(--aegion-platform-accent-soft)] aegion-btn-shape"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
          </span>
          <div>
            <div className="text-xs font-semibold text-[var(--aegion-platform-text)] font-display">
              Aegion Architecture Blueprint
            </div>
            <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">
              Live Theme: {activeTheme.name} ({activeTheme.surfaceStyle})
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] text-[var(--aegion-platform-text-secondary)] aegion-btn-shape">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
          Approval Governed
        </span>
      </div>

      {/* Interactive 3-Node Architecture Pipeline */}
      <div className="relative z-10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {STAGES.map((stage) => {
            const selected = stage.id === selectedId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedId(stage.id)}
                onMouseEnter={() => setSelectedId(stage.id)}
                className={`p-3 text-left border transition-all cursor-pointer aegion-btn-shape ${
                  selected
                    ? 'border-[var(--aegion-platform-accent)] bg-[var(--aegion-platform-accent-soft)] shadow-sm'
                    : 'border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] hover:border-[var(--aegion-platform-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold text-[var(--aegion-platform-accent)]">
                    LAYER {stage.step}
                  </span>
                  {stage.icon}
                </div>
                <div className="text-xs font-semibold text-[var(--aegion-platform-text)] font-display">
                  {stage.label}
                </div>
                <div className="text-[11px] text-[var(--aegion-platform-text-muted)] mt-0.5 line-clamp-1">
                  {stage.items[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Crisp Architectural Flow Connector Bar */}
        <div className="flex items-center gap-2 px-1" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--aegion-platform-border-strong)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--aegion-platform-text-muted)]">
            {activeStage.step} · {activeStage.label} Active
          </span>
          <span className="h-px flex-1 bg-[var(--aegion-platform-border-strong)]" />
        </div>

        {/* Focused Stage Inspection Panel */}
        <div
          className="p-4 border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] space-y-3"
          style={{ borderRadius: 'calc(var(--aegion-platform-radius) - 4px)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display">
                {activeStage.title}
              </h3>
              <p className="text-xs text-[var(--aegion-platform-text-muted)] leading-relaxed">
                {activeStage.summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {activeStage.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-surface-solid)] text-[var(--aegion-platform-text-secondary)] aegion-btn-shape"
              >
                <CheckCircle2 className="w-3 h-3 text-[var(--aegion-platform-accent)] shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Governance & Theme Capabilities Footer */}
      <div className="relative z-10 pt-3 border-t border-[var(--aegion-platform-border)] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--aegion-platform-text-secondary)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3 h-3 text-[var(--aegion-platform-accent)]" />
            Verified Access
          </span>
          <span className="inline-flex items-center gap-1">
            <Palette className="w-3 h-3 text-[var(--aegion-platform-accent)]" />
            Decoupled Themes
          </span>
        </div>
        <span className="tabular-nums font-semibold text-[var(--aegion-platform-text)]">
          10 Platform Themes · 50 App Themes
        </span>
      </div>
    </div>
  );
};
