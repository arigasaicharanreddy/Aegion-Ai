export type UserRole = 'builder' | 'super_admin';

export type AccountStatus =
  | 'pending_approval'
  | 'info_requested'
  | 'approved_pending_activation'
  | 'active'
  | 'rejected'
  | 'suspended';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  pythonBackendUrl: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  mustChangePassword?: boolean;
  mfaEnabled?: boolean;
  authProvider: 'password' | 'google';
  workspaceId: string;
  workspaceName: string;
  avatarUrl?: string;
}
