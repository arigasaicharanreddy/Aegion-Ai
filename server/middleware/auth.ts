import type { Request, Response, NextFunction } from 'express';
import { appendAuditLog, loadDb, persistDb, type StoredUserRecord } from '../data/database';
import { generateSecureToken, sha256Hex } from '../security/crypto';

export const SESSION_COOKIE_NAME = 'aegion_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AuthenticatedRequest extends Request {
  authUser?: StoredUserRecord;
  sessionTokenHash?: string;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
    }
  }
  return result;
}

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export async function createUserSession(
  user: StoredUserRecord,
  res: Response,
  options: { isDevPreview?: boolean } = {}
): Promise<string> {
  const db = await loadDb();
  const rawToken = generateSecureToken(32);
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  db.sessions.push({
    tokenHash,
    userId: user.id,
    email: user.email,
    role: user.role,
    isDevPreview: Boolean(options.isDevPreview),
    createdAt: now.toISOString(),
    expiresAt,
  });

  // Prune expired sessions
  const nowMs = now.getTime();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > nowMs);
  await persistDb(db);

  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.APP_URL?.startsWith('https://')),
    sameSite: process.env.APP_URL?.startsWith('https://') ? 'none' : 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return rawToken;
}

export async function revokeUserSessions(userId: string, exceptTokenHash?: string): Promise<void> {
  const db = await loadDb();
  db.sessions = db.sessions.filter(
    (s) => s.userId !== userId || (exceptTokenHash && s.tokenHash === exceptTokenHash)
  );
  await persistDb(db);
}

export async function resolveSessionUser(req: Request): Promise<{
  user: StoredUserRecord | null;
  tokenHash?: string;
  isDevPreview?: boolean;
}> {
  const rawToken = extractSessionToken(req);
  if (!rawToken) return { user: null };

  const tokenHash = sha256Hex(rawToken);
  const db = await loadDb();
  const session = db.sessions.find((s) => s.tokenHash === tokenHash);
  if (!session) return { user: null };

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
    await persistDb(db);
    return { user: null };
  }

  const user = db.users.find((u) => u.id === session.userId) || null;
  return { user, tokenHash, isDevPreview: Boolean(session.isDevPreview) };
}

export async function requireSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { user, tokenHash } = await resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  req.authUser = user;
  req.sessionTokenHash = tokenHash;
  return next();
}

export async function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { user, tokenHash, isDevPreview } = await resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Super Admin authentication required.' });
  }
  if (user.role !== 'super_admin') {
    const db = await loadDb();
    appendAuditLog(db, user.email, user.role, 'ADMIN_ACCESS_DENIED', req.originalUrl, 'Denied');
    await persistDb(db);
    return res.status(403).json({
      error: 'Forbidden: Only the Super Admin can access this resource or export platform data.',
    });
  }
  if (user.mustChangePassword && !isDevPreview) {
    return res.status(403).json({
      error: 'Password change required before accessing Super Admin console.',
      mustChangePassword: true,
    });
  }
  req.authUser = user;
  req.sessionTokenHash = tokenHash;
  return next();
}

export async function requireApprovedBuilder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { user, tokenHash } = await resolveSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to use the application builder.' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({
      error: 'Your account is not active yet. Super Admin approval and account activation are required.',
      accountStatus: user.status,
    });
  }
  req.authUser = user;
  req.sessionTokenHash = tokenHash;
  return next();
}

export function sanitizeUserForClient(user: StoredUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: user.mfaEnabled,
    authProvider: user.authProvider,
    workspaceId: user.workspaceId,
    workspaceName: user.workspaceName,
    avatarUrl: user.avatarUrl,
  };
}
