import React from 'react';
import { ArrowRight, Database, Layers, Palette, Server, ShieldCheck } from 'lucide-react';
import { usePlatformTheme } from '../../context/PlatformThemeContext';

interface BuilderArchitectureBlueprintProps {
  projectName: string;
  modules: string[];
  tableCount: number;
  endpointCount: number;
}

export const BuilderArchitectureBlueprint: React.FC<BuilderArchitectureBlueprintProps> = ({
  projectName,
  modules,
  tableCount,
  endpointCount,
}) => {
  const { activeTheme } = usePlatformTheme();

  const layers = [
    {
      title: 'Workspace UI & Theme Tokens',
      detail: `${activeTheme.name} · Isolated Preview CSS`,
      icon: <Palette className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />,
    },
    {
      title: 'Domain Modules',
      detail: modules.slice(0, 3).join(' · ') || 'Core Application Flows',
      icon: <Layers className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />,
    },
    {
      title: 'API & Access Layer',
      detail: `${endpointCount} Endpoints · Role Governed`,
      icon: <Server className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />,
    },
    {
      title: 'Relational Schema',
      detail: `${tableCount} PostgreSQL Entities`,
      icon: <Database className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />,
    },
  ];

  return (
    <div className="aegion-glass p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
          <span className="text-xs font-semibold text-[var(--aegion-platform-text)] font-display">
            {projectName} — System Architecture Topology
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--aegion-platform-text-muted)]">
          {modules.length} Modules · {tableCount} Tables · {endpointCount} APIs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {layers.map((layer, index) => (
          <div
            key={layer.title}
            className="p-3 border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] flex items-start justify-between gap-2 aegion-btn-shape"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--aegion-platform-text)]">
                {layer.icon}
                <span className="truncate">{layer.title}</span>
              </div>
              <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">
                {layer.detail}
              </div>
            </div>
            {index < layers.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)] hidden lg:block shrink-0 mt-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
