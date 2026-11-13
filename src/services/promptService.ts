import { PromptEntry } from '../types/prompt';
import { UserRole } from '../types/auth';
import { apiClient } from './apiClient';

export function canUserAccessPromptContent(prompt: PromptEntry, role: UserRole): boolean {
  if (!prompt.protected) return true;
  return role === 'super_admin';
}

export async function checkPromptMutationPermission(
  role: UserRole,
  action: 'view' | 'edit' | 'approve' | 'delete',
  prompt: PromptEntry
): Promise<{ allowed: boolean; reason?: string }> {
  return apiClient.authorizePromptAction(role, action, prompt.layer, prompt.protected);
}

export function bumpMinorVersion(version: string): string {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return 'v1.0.1';
  const [, major, minor, patch] = match;
  return `v${major}.${Number(minor) + 1}.${patch}`;
}
