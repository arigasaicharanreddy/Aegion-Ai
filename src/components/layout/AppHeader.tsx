import React, { useMemo, useState } from 'react';
import { Bell, Download, Menu, Plus, Search, Shield, SlidersHorizontal, User } from 'lucide-react';
import { useAegion, type AppRoute } from '../../context/AegionContext';
import { exportProjectZip } from '../../services/projectService';
import { Button } from '../common/Button';
import { QuickThemeSwitcher } from '../platform-themes/QuickThemeSwitcher';

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewProject: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Workspace Overview',
  projects: 'Projects & Versions',
  builder: 'Agentic Builder Studio',
  templates: 'Application Templates',
  prompts: 'Prompt Registry',
  themes: 'Platform & App Theme Studio',
  deployments: 'Python FastAPI & Cloud Deployments',
  usage: 'Workspace Usage',
  settings: 'Profile, Appearance & Security',
  support: 'Aegion Support',
  admin: 'Super Admin Control Plane',
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewProject,
}) => {
  const {
    route,
    navigate,
    activeProject,
    projects,
    setActiveProjectId,
    user,
    logout,
    platformCompactMode,
    setPlatformCompactMode,
    auditLogs,
    notify,
  } = useAegion();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedProjects = projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.language.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        label: p.name,
        meta: `${p.language} · ${p.version}`,
        action: () => {
          setActiveProjectId(p.id);
          navigate('builder');
        },
      }));

    const quickNav: { id: string; label: string; meta: string; route: AppRoute }[] = [
      { id: 'nav-platform-themes', label: '10 Platform Themes Studio', meta: 'Appearance', route: 'themes' },
      { id: 'nav-themes', label: '50 Generated App Theme Presets', meta: 'Theme Library', route: 'themes' },
      { id: 'nav-prompts', label: 'Layered Prompt Registry', meta: 'Governance', route: 'prompts' },
      { id: 'nav-templates', label: 'Enterprise App Templates', meta: 'Templates', route: 'templates' },
    ];
    const matchedNav = quickNav
      .filter((n) => n.label.toLowerCase().includes(q) || n.meta.toLowerCase().includes(q))
      .map((n) => ({
        id: n.id,
        label: n.label,
        meta: n.meta,
        action: () => navigate(n.route),
      }));

    return [...matchedProjects, ...matchedNav];
  }, [searchQuery, projects, setActiveProjectId, navigate]);

  const handleDownload = async () => {
    await exportProjectZip(activeProject);
    notify(`Exported ${activeProject.name} (${activeProject.version}) ZIP`, 'success');
  };

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[var(--aegion-platform-border)] aegion-nav-surface flex items-center justify-between gap-4 shrink-0 relative z-30">
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-[var(--aegion-platform-text-muted)] whitespace-nowrap hidden sm:inline">
            {ROUTE_LABELS[route] || 'Workspace'}
          </span>
          <span className="text-[var(--aegion-platform-border-strong)] hidden sm:inline">/</span>
          <span className="font-semibold text-[var(--aegion-platform-text)] truncate font-display">
            {activeProject.name}
          </span>
          <span className="text-xs text-[var(--aegion-platform-text-muted)] tabular-nums hidden xl:inline whitespace-nowrap">
            {activeProject.version} · {activeProject.language}
          </span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:block relative w-56 lg:w-72">
        <Search className="w-3.5 h-3.5 text-[var(--aegion-platform-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, themes, prompts..."
          className="w-full bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape pl-8 pr-3 py-1.5 text-xs text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
        />
        {searchFocused && searchResults.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1.5 border border-[var(--aegion-platform-border-strong)] shadow-2xl p-1.5 space-y-0.5 z-50"
            style={{
              backgroundColor: 'var(--aegion-platform-surface-solid)',
              borderRadius: 'var(--aegion-platform-radius)',
            }}
          >
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={item.action}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
              >
                <span className="text-[var(--aegion-platform-text)] font-medium truncate">
                  {item.label}
                </span>
                <span className="text-[11px] text-[var(--aegion-platform-text-muted)] shrink-0">
                  {item.meta}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Theme Switcher, Controls, Notifications, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickThemeSwitcher />

        <Button type="button" variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Export ZIP</span>
        </Button>

        <Button type="button" size="sm" onClick={onOpenNewProject}>
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </Button>

        <button
          type="button"
          title={platformCompactMode ? 'Switch to Comfortable density' : 'Switch to Compact density'}
          onClick={() => {
            setPlatformCompactMode(!platformCompactMode);
            notify(
              !platformCompactMode ? 'Compact workspace density enabled' : 'Comfortable workspace density enabled',
              'info'
            );
          }}
          className="p-2 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border)] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Notification Center */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notification Center"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            className="p-2 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border)] cursor-pointer relative"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 border border-[var(--aegion-platform-border-strong)] shadow-2xl p-3 space-y-2.5 z-50"
              style={{
                backgroundColor: 'var(--aegion-platform-surface-solid)',
                borderRadius: 'var(--aegion-platform-radius)',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--aegion-platform-text)]">Activity & Alerts</span>
                {user?.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('admin');
                    }}
                    className="text-[var(--aegion-platform-accent)] hover:underline cursor-pointer"
                  >
                    Admin Console
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-[var(--aegion-platform-bg-alt)] border border-[var(--aegion-platform-border)] text-[11px]"
                  >
                    <div className="text-[var(--aegion-platform-text)] font-medium truncate">{log.action}</div>
                    <div className="text-[var(--aegion-platform-text-muted)] truncate">{log.target}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 aegion-btn-shape bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] hover:border-[var(--aegion-platform-border-strong)] text-xs text-[var(--aegion-platform-text)] cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
              <span className="hidden sm:inline max-w-[110px] truncate">{user.name}</span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-60 border border-[var(--aegion-platform-border-strong)] shadow-2xl p-3 space-y-2 z-50 text-xs"
                style={{
                  backgroundColor: 'var(--aegion-platform-surface-solid)',
                  borderRadius: 'var(--aegion-platform-radius)',
                }}
              >
                <div className="pb-2 border-b border-[var(--aegion-platform-border)]">
                  <div className="font-semibold text-[var(--aegion-platform-text)] truncate">{user.name}</div>
                  <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">{user.email}</div>
                  <div className="text-[11px] font-mono text-[var(--aegion-platform-accent)] mt-0.5">
                    {user.role === 'super_admin' ? 'Super Admin' : 'Approved Builder'}
                  </div>
                </div>
                {user.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('admin');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[var(--aegion-platform-text-secondary)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                    <span>Super Admin Console</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('themes');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[var(--aegion-platform-text-secondary)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
                >
                  Platform Theme Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('settings');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[var(--aegion-platform-text-secondary)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
                >
                  Profile & Security
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
