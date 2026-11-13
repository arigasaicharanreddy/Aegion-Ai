import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAegion } from '../context/AegionContext';
import { apiClient, BackendHealthStatus } from '../services/apiClient';
import { exportPythonBackendScaffoldZip, exportProjectZip } from '../services/projectService';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { PreviewPanel } from '../components/layout/PreviewPanel';
import { SupportTicket } from '../types/project';

export const DeploymentsPage: React.FC = () => {
  const { activeProject, runtimeMode, notify } = useAegion();
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleDownloadPython = async () => {
    await exportPythonBackendScaffoldZip();
    notify('Downloaded Python FastAPI + LangGraph + RAG backend scaffold ZIP', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Deployments & Python Backend Service
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            AI Studio serves the React frontend and Express SSE gateway; FastAPI, SMTP, and external integrations remain optional in Free Dev Mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={loadHealth}>
            <RefreshCw className="w-3.5 h-3.5" />
            Check Gateway
          </Button>
          <Button type="button" size="sm" onClick={handleDownloadPython}>
            <Download className="w-3.5 h-3.5" />
            Download FastAPI Backend ZIP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="space-y-3">
          <h2 className="text-base font-semibold text-white font-display">Active Runtime Topology</h2>
          {loading ? (
            <p className="text-xs text-[#9CA3AF]">Checking gateway configuration...</p>
          ) : health ? (
            <div className="space-y-2 text-xs text-[#D1D5DB]">
              <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-[#9CA3AF]">Runtime Mode</span>
                <span className="font-mono text-emerald-400">
                  {runtimeMode.freeDevMode ? 'Free Development Mode' : 'Production'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-[#9CA3AF]">Gateway Adapter</span>
                <span className="font-mono">{health.gatewayRuntime}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-[#9CA3AF]">External Python FastAPI</span>
                <span className="font-mono">
                  {health.pythonBackendConfigured ? health.pythonBackendUrl : 'Optional (Mock / Gateway Active)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-[#9CA3AF]">Server Gemini AI</span>
                <span className="font-mono">
                  {runtimeMode.geminiConfigured ? 'Configured (gemini-4-hydrogen)' : 'Optional (Free Dev Mock Active)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#9CA3AF]">Email Notifications</span>
                <span className="font-mono">
                  {runtimeMode.emailConfigured ? 'Configured' : 'Optional (Skipped in Dev)'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400">Gateway health check unavailable.</p>
          )}
        </GlassCard>

        <GlassCard className="space-y-3">
          <h2 className="text-base font-semibold text-white font-display">
            Export {activeProject.name}
          </h2>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Package the generated {activeProject.language} ({activeProject.framework}) source files,
            PostgreSQL schema definitions, decoupled CSS theme tokens, and Project Memory snapshot.
          </p>
          <div className="pt-2">
            <Button type="button" variant="secondary" onClick={() => exportProjectZip(activeProject)}>
              <Download className="w-4 h-4" />
              Export Project Bundle ({activeProject.version})
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export const UsagePage: React.FC = () => {
  const { projects, prompts, chatHistory } = useAegion();
  const totalMessages = Object.values(chatHistory).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Workspace Usage</h1>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Generation volume across projects, multi-language packs, and version snapshots.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding="sm">
          <div className="text-xs text-[#9CA3AF]">Active Projects</div>
          <div className="text-2xl font-bold text-white font-display tabular-nums mt-1">{projects.length}</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[#9CA3AF]">Chat Turns</div>
          <div className="text-2xl font-bold text-white font-display tabular-nums mt-1">{totalMessages}</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[#9CA3AF]">Prompt Packs</div>
          <div className="text-2xl font-bold text-white font-display tabular-nums mt-1">{prompts.length}</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-[#9CA3AF]">Generated Source Files</div>
          <div className="text-2xl font-bold text-white font-display tabular-nums mt-1">
            {projects.reduce((sum, p) => sum + p.files.length, 0)}
          </div>
        </GlassCard>
      </div>

      <DataTable
        rows={projects}
        rowKey={(p) => p.id}
        columns={[
          { key: 'name', header: 'Project', render: (p) => <span className="text-white font-medium">{p.name}</span> },
          { key: 'lang', header: 'Target Stack', render: (p) => <span className="text-xs text-[#D1D5DB]">{p.language} / {p.framework}</span> },
          { key: 'versions', header: 'Versions', align: 'right', render: (p) => <span className="tabular-nums">{p.versions.length}</span> },
          { key: 'files', header: 'Files', align: 'right', render: (p) => <span className="tabular-nums">{p.files.length}</span> },
        ]}
      />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { workspace, updateWorkspace, user } = useAegion();
  const [name, setName] = useState(workspace.name);
  const [pythonUrl, setPythonUrl] = useState(workspace.pythonBackendUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace({ name, pythonBackendUrl: pythonUrl });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Workspace Settings</h1>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Configure workspace identity and external Python FastAPI endpoint routing.
        </p>
      </div>

      <GlassCard>
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#D1D5DB]">Workspace Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#D1D5DB]">
              External Python FastAPI Service URL (Optional)
            </span>
            <input
              type="url"
              value={pythonUrl}
              onChange={(e) => setPythonUrl(e.target.value)}
              placeholder="https://aegion-python-engine-xxxx.run.app"
              className="w-full bg-[#181922] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white font-mono"
            />
            <span className="text-[11px] text-[#9CA3AF]">
              Set AEGION_PYTHON_API_URL in your server environment to route SSE orchestration to your deployed FastAPI + LangGraph container.
            </span>
          </label>

          <div className="pt-2 border-t border-white/10 text-xs text-[#9CA3AF]">
            Signed in as {user?.email || 'Guest'} ({user?.role || 'builder'})
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Workspace Settings</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export const SupportPage: React.FC = () => {
  const { tickets, createTicket } = useAegion();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Architecture');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Standard');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createTicket({ subject, category, priority, message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Contact Aegion Support</h1>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Request custom language prompt packs, Cloud Run deployment guidance, or workspace assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Subject</span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of request"
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="Code Generation">Code Generation</option>
                    <option value="Theme Engine">Theme Engine</option>
                    <option value="Deployment">Deployment</option>
                    <option value="Billing">Billing</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#D1D5DB]">Priority</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                    className="w-full bg-[#181922] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#D1D5DB]">Details</span>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Include project ID, target language, or error details..."
                  className="w-full bg-[#181922] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </label>

              <Button type="submit" className="w-full">
                Submit Support Ticket
              </Button>
            </form>
          </GlassCard>
        </div>

        <div className="lg:col-span-7">
          <DataTable
            rows={tickets}
            rowKey={(t) => t.id}
            columns={[
              { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-[#A78BFA]">{t.id}</span> },
              {
                key: 'subject',
                header: 'Subject',
                render: (t) => (
                  <div>
                    <div className="text-white font-medium text-xs">{t.subject}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{t.category}</div>
                  </div>
                ),
              },
              { key: 'priority', header: 'Priority', render: (t) => <span className="text-xs">{t.priority}</span> },
              { key: 'status', header: 'Status', align: 'right', render: (t) => <span className="text-xs text-[#E5E7EB]">{t.status}</span> },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export const SharedPreviewPage: React.FC = () => {
  const { sharedProject, navigate } = useAegion();

  if (!sharedProject) {
    return (
      <div className="min-h-screen bg-[#09090C] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display">Preview Link Unavailable</h1>
        <p className="text-sm text-[#9CA3AF]">This read-only project preview is disabled or invalid.</p>
        <Button type="button" onClick={() => navigate('landing')}>
          Return to Aegion AI
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#09090C] text-white">
      <header className="h-14 px-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="font-bold font-display">{sharedProject.name}</span>
          <span className="text-xs text-[#9CA3AF] ml-3">
            Read-Only Shared Preview · {sharedProject.version}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            window.history.replaceState({}, '', window.location.pathname);
            navigate('landing');
          }}
        >
          Built with Aegion AI
        </Button>
      </header>
      <div className="flex-1 min-h-0">
        <PreviewPanel project={sharedProject} readOnly />
      </div>
    </div>
  );
};
