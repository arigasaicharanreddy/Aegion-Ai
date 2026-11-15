import React from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AegionProvider, useAegion } from './context/AegionContext';
import { PlatformThemeProvider, usePlatformTheme } from './context/PlatformThemeContext';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { AegionChatbot } from './components/common/AegionChatbot';
import { PageTransition } from './components/common/MotionWrapper';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { RegistrationStatusPage } from './pages/RegistrationStatusPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { BuilderPage } from './pages/BuilderPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { PromptLibraryPage } from './pages/PromptLibraryPage';
import { ThemeLibraryPage } from './pages/ThemeLibraryPage';
import { AdminPage } from './pages/AdminPage';
import {
  DeploymentsPage,
  SettingsPage,
  SharedPreviewPage,
  SupportPage,
  UsagePage,
} from './pages/WorkspaceOpsPages';

const AegionRouter: React.FC = () => {
  const { route, user, authInitialized } = useAegion();

  if (route === 'landing') return <LandingPage />;
  if (route === 'login') return <AuthPage initialMode="login" />;
  if (route === 'forgot-password') return <AuthPage initialMode="forgot-password" />;
  if (route === 'reset-password') return <AuthPage initialMode="reset-password" />;
  if (route === 'register') return <RegistrationPage />;
  if (route === 'pending-approval') return <RegistrationStatusPage mode="status" />;
  if (route === 'activate') return <RegistrationStatusPage mode="activate" />;
  if (route === 'verify-email') return <RegistrationStatusPage mode="verify-email" />;
  if (route === 'admin-login' || route === 'admin-reset') return <AdminAuthPage />;
  if (route === 'shared-preview') return <SharedPreviewPage />;

  if (!authInitialized) {
    return (
      <div className="h-screen w-full bg-[var(--aegion-platform-bg)] flex items-center justify-center text-xs text-[var(--aegion-platform-text-muted)]">
        Verifying workspace session...
      </div>
    );
  }

  // Approval-based hard gate on all workspace & builder routes
  if (!user) {
    return <AuthPage initialMode="login" />;
  }
  if (user.status !== 'active') {
    return <RegistrationStatusPage mode="status" />;
  }
  if (route === 'admin' && (user.role !== 'super_admin' || user.mustChangePassword)) {
    return <AdminAuthPage />;
  }

  const renderWorkspacePage = () => {
    switch (route) {
      case 'dashboard':
        return <DashboardPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'builder':
        return <BuilderPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'prompts':
        return <PromptLibraryPage />;
      case 'themes':
        return <ThemeLibraryPage />;
      case 'deployments':
        return <DeploymentsPage />;
      case 'usage':
        return <UsagePage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <WorkspaceLayout>
      <AnimatePresence mode="wait">
        <PageTransition key={route} routeKey={route}>
          {renderWorkspacePage()}
        </PageTransition>
      </AnimatePresence>
    </WorkspaceLayout>
  );
};

const ThemedAppShell: React.FC = () => {
  const { effectiveMotionMode } = usePlatformTheme();
  return (
    <MotionConfig reducedMotion={effectiveMotionMode === 'disabled' ? 'always' : 'user'}>
      <AegionRouter />
      <AegionChatbot />
      <ToastContainer />
    </MotionConfig>
  );
};

export function App() {
  return (
    <AegionProvider>
      <PlatformThemeProvider>
        <ThemedAppShell />
      </PlatformThemeProvider>
    </AegionProvider>
  );
}

export default App;
