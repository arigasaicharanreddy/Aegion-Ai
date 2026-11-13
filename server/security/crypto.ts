import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  const expected = Buffer.from(hexDigest, 'hex');
  const actual = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { N: 16384, r: 8, p: 1 });
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function validateStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof password !== 'string' || password.length < 12) {
    errors.push('Password must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return { valid: errors.length === 0, errors };
}

export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}

export function generateBootstrapPassphrase(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*-_';
  const all = upper + lower + digits + special;
  const chars = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];
  for (let i = 0; i < 14; i++) {
    chars.push(all[crypto.randomInt(all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function verifyHmacSha256Signature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const rateBuckets = new Map<string, number[]>();

export function createRateLimiter(options: { windowMs: number; maxRequests: number; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;
    const recent = (rateBuckets.get(key) || []).filter((ts) => ts > windowStart);
    if (recent.length >= options.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait before retrying.',
      });
    }
    recent.push(now);
    rateBuckets.set(key, recent);
    return next();
  };
}

export interface SafeFileValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedName?: string;
}

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.pdf']);
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

export function validateUiReferenceUpload(
  fileName?: string,
  mimeType?: string,
  base64Payload?: string
): SafeFileValidationResult {
  if (!fileName) return { valid: true };

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const dotIdx = cleanName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? cleanName.slice(dotIdx).toLowerCase() : '';

  if (!ALLOWED_EXT.has(ext)) {
    return { valid: false, reason: 'Only PNG, JPG, JPEG, WEBP, and PDF files are permitted for UI references.' };
  }

  if (mimeType && !ALLOWED_MIME.has(mimeType.toLowerCase())) {
    return { valid: false, reason: 'Unsupported MIME type for UI reference upload.' };
  }

  if (base64Payload) {
    const raw = base64Payload.includes(',') ? base64Payload.split(',')[1] : base64Payload;
    const buf = Buffer.from(raw, 'base64');
    if (buf.length > 5 * 1024 * 1024) {
      return { valid: false, reason: 'UI reference file exceeds the 5 MB security limit.' };
    }
    const isPng = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const isJpg = buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const isPdf = buf.subarray(0, 4).toString('ascii') === '%PDF';
    const isWebp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!isPng && !isJpg && !isPdf && !isWebp) {
      return { valid: false, reason: 'Uploaded file magic bytes do not match a valid image or PDF.' };
    }
  }

  return { valid: true, sanitizedName: cleanName };
}
