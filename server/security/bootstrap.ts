import { loadDb, persistDb } from '../data/database';
import { generateBootstrapPassphrase, hashPassword } from './crypto';

export const SUPER_ADMIN_EMAIL = 'arigasaicharan@gmail.com';

export async function bootstrapSuperAdmin(): Promise<void> {
  const db = await loadDb();
  const existing = db.users.find(
    (u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

  if (existing && existing.passwordHash) {
    // Ensure role and status invariants are preserved
    let modified = false;
    if (existing.role !== 'super_admin') {
      existing.role = 'super_admin';
      modified = true;
    }
    if (existing.status !== 'active') {
      existing.status = 'active';
      modified = true;
    }
    if (modified) {
      await persistDb(db);
    }
    return;
  }

  const envPassword = process.env.AEGION_SUPER_ADMIN_INITIAL_PASSWORD?.trim();
  const initialPassword = envPassword || generateBootstrapPassphrase();
  const passwordHash = hashPassword(initialPassword);
  const now = new Date().toISOString();

  if (existing) {
    existing.role = 'super_admin';
    existing.status = 'active';
    existing.passwordHash = passwordHash;
    existing.mustChangePassword = true;
    existing.updatedAt = now;
  } else {
    db.users.unshift({
      id: 'usr-super-admin-charan',
      name: 'Charan Ariga',
      email: SUPER_ADMIN_EMAIL,
      role: 'super_admin',
      status: 'active',
      passwordHash,
      mustChangePassword: true,
      mfaEnabled: false,
      authProvider: 'password',
      workspaceId: 'ws-aegion-core',
      workspaceName: 'Aegion Core Studio',
      createdAt: now,
      updatedAt: now,
    });
  }

  await persistDb(db);

  console.log('\n============================================================');
  console.log('AEGION AI — SUPER ADMIN ONE-TIME BOOTSTRAP PROVISIONING');
  console.log(`Super Admin Email : ${SUPER_ADMIN_EMAIL}`);
  if (envPassword) {
    console.log('Initial Password  : Provided via AEGION_SUPER_ADMIN_INITIAL_PASSWORD env var');
  } else {
    console.log(`One-Time Password : ${initialPassword}`);
  }
  console.log('Policy            : Forced password change required on first password login.');
  if (process.env.NODE_ENV !== 'production') {
    console.log('Free Dev Mode     : Enabled (UI preview & mock fallbacks do not block when optional secrets are omitted)');
  }
  console.log('============================================================\n');
}
