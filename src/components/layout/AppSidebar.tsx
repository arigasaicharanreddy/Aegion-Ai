import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquareCode,
  Layers,
  BookOpen,
  Palette,
  Rocket,
  BarChart3,
  Settings,
  LifeBuoy,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppRoute, useAegion } from '../../context/AegionContext';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { route, navigate, user, logout } = useAegion();

  const navItems: { id: AppRoute; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'builder', label: 'AI Builder', icon: <MessageSquareCode className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'prompts', label: 'Prompt Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'themes', label: 'Theme Studio', icon: <Palette className="w-4 h-4" /> },
    { id: 'deployments', label: 'Deployments', icon: <Rocket className="w-4 h-4" /> },
    { id: 'usage', label: 'Usage', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <LifeBuoy className="w-4 h-4" /> },
    {
      id: 'admin',
      label: 'Super Admin',
      icon: <Shield className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'super_admin'
  );

  const handleNav = (id: AppRoute) => {
    navigate(id);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col aegion-sidebar-surface border-r border-[var(--aegion-platform-border)] transition-all duration-200 shrink-0 ${
          collapsed ? 'w-[68px]' : 'w-[244px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-14 px-4 border-b border-[var(--aegion-platform-border)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="text-base font-bold tracking-tight text-[var(--aegion-platform-text)] font-display whitespace-nowrap truncate cursor-pointer"
          >
            {collapsed ? 'AE' : 'Aegion AI'}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:inline-flex p-1.5 rounded-md text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {visibleItems.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 aegion-btn-shape text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border-strong)]'
                    : 'text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] border border-transparent'
                }`}
              >
                <span className={active ? 'text-[var(--aegion-platform-accent)]' : ''}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--aegion-platform-border)] space-y-2">
          {!collapsed && user && (
            <div className="px-2 py-1.5">
              <div className="text-xs font-semibold text-[var(--aegion-platform-text)] truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">
                {user.role === 'super_admin' ? 'Super Admin' : 'Builder'} · {user.workspaceName}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="w-full flex items-center gap-2.5 px-3 py-2 aegion-btn-shape text-xs font-medium text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-accent-soft)] cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
