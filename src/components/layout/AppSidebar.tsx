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
    { id: 'themes', label: 'Theme Library', icon: <Palette className="w-4 h-4" /> },
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
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0D0E13] border-r border-white/10 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-[68px]' : 'w-[244px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="text-base font-bold tracking-tight text-white font-display whitespace-nowrap truncate cursor-pointer"
          >
            {collapsed ? 'AE' : 'Aegion AI'}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:inline-flex p-1.5 rounded-md text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer"
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#7C3AED]/18 text-white border border-[#8B5CF6]/35'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <span className={active ? 'text-[#A78BFA]' : ''}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          {!collapsed && user && (
            <div className="px-2 py-1.5">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-[#9CA3AF] truncate">
                {user.role === 'super_admin' ? 'Super Admin' : 'Builder'} · {user.workspaceName}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#9CA3AF] hover:text-white hover:bg-white/[0.05] cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
