export type UserRole = 'super_admin' | 'builder';

export type AccountStatus =
  | 'pending_approval'
  | 'approved_pending_activation'
  | 'active'
  | 'rejected'
  | 'suspended';

export type PlatformAnimationMode = 'full' | 'balanced' | 'minimal' | 'disabled';

export interface PlatformThemePreference {
  themeId: string;
  animationMode: PlatformAnimationMode;
  enable3D: boolean;
  updatedAt?: string;
}

export interface PlatformThemeGovernanceConfig {
  defaultPublicThemeId: string;
  defaultUserThemeId: string;
  defaultAdminThemeId: string;
  fallbackThemeId: string;
  disabledThemeIds: string[];
  disabledCategories: string[];
  animationsGloballyAllowed: boolean;
  threeDGloballyAllowed: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserPreferences {
  themePreference?: 'dark' | 'light';
  compactMode?: boolean;
  emailNotificationsEnabled?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  pendingEmail?: string;
  role: UserRole;
  status: AccountStatus;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  authProvider: 'password' | 'google';
  workspaceId: string;
  workspaceName: string;
  avatarUrl?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  country?: string;
  preferences?: UserPreferences;
  platformTheme?: PlatformThemePreference;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  pythonBackendUrl: string;
  createdAt: string;
}
