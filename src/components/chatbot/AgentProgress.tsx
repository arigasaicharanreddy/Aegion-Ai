import React from 'react';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';
import { AgentExecutionStep } from '../../types/chat';

interface AgentProgressProps {
  steps: AgentExecutionStep[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ steps }) => {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] p-3.5 space-y-2">
      <div className="text-xs font-medium text-[var(--aegion-platform-text-secondary)]">LangGraph Agent Pipeline</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 shrink-0">
              {step.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              {step.status === 'running' && (
                <Loader2 className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)] animate-spin" />
              )}
              {step.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              {step.status === 'pending' && <Circle className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)]" />}
            </span>
            <div className="min-w-0">
              <div className="text-[var(--aegion-platform-text)] font-medium truncate">{step.label}</div>
              {step.detail && <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">{step.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
