import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { db } from './db';

const SESSION_COOKIE = 'ztn_session';
const SESSION_DAYS = 30;

export function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function timingSafeEqualHex(a: string, b: string) {
  const aa = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export async function createSession(userId: string) {
  const raw = randomToken();
  await db.userSession.create({
    data: {
      tokenHash: hash(raw),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? process.env.SESSION_COOKIE_SECURE !== 'false' : process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
  return raw;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.userSession.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.userSession.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const session = token ? await db.userSession.findUnique({ where: { tokenHash: hash(token) } }) : null;
  if (user.role !== 'ADMIN' || !user.admin2faEnabled || !session?.admin2faVerifiedAt || (Date.now() - session.admin2faVerifiedAt.getTime()) > 24 * 3600 * 1000) throw new Error('FORBIDDEN');
  return user;
}

export async function sameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  const host = h.get('host');
  if (!origin || !host) return true;
  return origin === `${origin.startsWith('https://') ? 'https' : 'http'}://${host}`;
}

export async function ipAddress() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function markAdmin2FAVerified(){ const jar=await cookies(); const token=jar.get(SESSION_COOKIE)?.value; if(!token) throw new Error('UNAUTHENTICATED'); return db.userSession.updateMany({where:{tokenHash:hash(token)},data:{admin2faVerifiedAt:new Date()}}); }
