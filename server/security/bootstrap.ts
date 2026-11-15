import { appendAuditLog, loadDb, persistDb } from '../data/database';
import { hashPassword } from './crypto';

export function getSuperAdminEmail(): string {
  return (process.env.AEGION_SUPER_ADMIN_EMAIL || 'aegionlabs.in@gmail.com').trim();
}

export function getSuperAdminInitialPassword(): string {
  return (
    process.env.AEGION_SUPER_ADMIN_INITIAL_PASSWORD ||
    process.env.AEGION_SUPER_ADMIN_PASSWORD ||
    ''
  ).trim();
}

export async function bootstrapSuperAdmin(): Promise<void> {
  const db = await loadDb();
  const configuredEmail = getSuperAdminEmail();
  const configuredEmailLower = configuredEmail.toLowerCase();
  const initialPassword = getSuperAdminInitialPassword();
  const forceReset = process.env.AEGION_SUPER_ADMIN_FORCE_RESET === 'true';
  const now = new Date().toISOString();

  let modified = false;

  // Prune any legacy dev-preview sessions
  if (db.sessions.some((s) => s.isDevPreview)) {
    db.sessions = db.sessions.filter((s) => !s.isDevPreview);
    modified = true;
  }

  // Locate existing super_admin records and enforce a sole super_admin account
  const superAdmins = db.users.filter((u) => u.role === 'super_admin');
  let primaryAdmin =
    superAdmins.find((u) => u.email.toLowerCase() === configuredEmailLower) || superAdmins[0];

  if (superAdmins.length > 1 && primaryAdmin) {
    const removedIds = new Set(superAdmins.filter((u) => u.id !== primaryAdmin!.id).map((u) => u.id));
    db.users = db.users.filter((u) => !removedIds.has(u.id));
    db.sessions = db.sessions.filter((s) => !removedIds.has(s.userId));
    modified = true;
  }

  if (primaryAdmin) {
    // Synchronize Super Admin email from configuration when account has not been rotated manually
    if (
      primaryAdmin.email.toLowerCase() !== configuredEmailLower &&
      (!primaryAdmin.customPasswordSet || primaryAdmin.email.toLowerCase() === 'arigasaicharan@gmail.com')
    ) {
      const previousEmail = primaryAdmin.email;
      primaryAdmin.email = configuredEmail;
      primaryAdmin.name = 'Aegion Labs Super Admin';
      primaryAdmin.customPasswordSet = false;
      primaryAdmin.mustChangePassword = false;
      if (initialPassword) {
        primaryAdmin.passwordHash = hashPassword(initialPassword);
      }
      primaryAdmin.updatedAt = now;
      db.sessions = db.sessions.filter((s) => s.userId !== primaryAdmin!.id);
      if (db.notificationConfig.senderEmail.toLowerCase() === previousEmail.toLowerCase()) {
        db.notificationConfig.senderEmail = configuredEmail;
      }
      appendAuditLog(
        db,
        configuredEmail,
        'super_admin',
        'PROVISION_SUPER_ADMIN_IDENTITY',
        `Provisioned sole Super Admin account ${configuredEmail}`,
        'Allowed'
      );
      modified = true;
    }

    if (primaryAdmin.status !== 'active') {
      primaryAdmin.status = 'active';
      modified = true;
    }
    if (primaryAdmin.authProvider !== 'password') {
      primaryAdmin.authProvider = 'password';
      modified = true;
    }
    if (primaryAdmin.mustChangePassword) {
      primaryAdmin.mustChangePassword = false;
      modified = true;
    }
    if (!primaryAdmin.platformTheme) {
      primaryAdmin.platformTheme = {
        themeId: db.platformThemeConfig.defaultAdminThemeId || 'graphite-executive',
        animationMode: 'balanced',
        enable3D: false,
        updatedAt: now,
      };
      modified = true;
    }

    if (forceReset && initialPassword) {
      primaryAdmin.email = configuredEmail;
      primaryAdmin.passwordHash = hashPassword(initialPassword);
      primaryAdmin.customPasswordSet = false;
      primaryAdmin.updatedAt = now;
      db.sessions = db.sessions.filter((s) => s.userId !== primaryAdmin!.id);
      appendAuditLog(
        db,
        primaryAdmin.email,
        'super_admin',
        'SUPER_ADMIN_REPROVISIONED',
        'Password re-provisioned from environment configuration',
        'Allowed'
      );
      modified = true;
    } else if (!primaryAdmin.passwordHash && initialPassword) {
      primaryAdmin.passwordHash = hashPassword(initialPassword);
      primaryAdmin.updatedAt = now;
      modified = true;
    }
  } else {
    db.users.unshift({
      id: 'usr-super-admin-aegionlabs',
      name: 'Aegion Labs Super Admin',
      email: configuredEmail,
      role: 'super_admin',
      status: 'active',
      passwordHash: initialPassword ? hashPassword(initialPassword) : undefined,
      mustChangePassword: false,
      customPasswordSet: false,
      mfaEnabled: false,
      authProvider: 'password',
      workspaceId: 'ws-aegion-core',
      workspaceName: 'Aegion Core Studio',
      platformTheme: {
        themeId: db.platformThemeConfig.defaultAdminThemeId || 'graphite-executive',
        animationMode: 'balanced',
        enable3D: false,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });
    appendAuditLog(
      db,
      configuredEmail,
      'super_admin',
      'CREATE_SUPER_ADMIN_ACCOUNT',
      `Created sole Super Admin account ${configuredEmail}`,
      'Allowed'
    );
    modified = true;
  }

  if (modified) {
    await persistDb(db);
  }
}
