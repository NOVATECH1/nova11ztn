import { rateLimit, tooMany } from '@/lib/rate-limit';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { createSession, ipAddress } from '@/lib/security';

function safeUsername(seed: string) {
  const cleaned = seed.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 18) || 'user';
  return `${cleaned}_${crypto.randomBytes(3).toString('hex')}`.slice(0, 30);
}

export async function GET(req: Request) {
  if (!(await rateLimit(`google:${await ipAddress()}`, 20, 600))) return tooMany();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const jar = await cookies();
  const storedState = jar.get('ztn_oauth_state')?.value;
  jar.delete('ztn_oauth_state');
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, url));
  if (!code || !state || !storedState || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState))) return NextResponse.json({ error: 'Invalid Google OAuth state.' }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !clientSecret || !appUrl) return NextResponse.json({ error: 'Google OAuth is not configured.' }, { status: 503 });
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  const tokens:any = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokens.access_token) return NextResponse.json({ error: 'Google sign-in failed.' }, { status: 401 });
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const profile:any = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !profile.email) return NextResponse.json({ error: 'Google profile could not be loaded.' }, { status: 401 });

  let user = await db.user.findUnique({ where: { email: String(profile.email).toLowerCase() } });
  let isNew = false;
  if (!user) {
    isNew = true;
    const email = String(profile.email).toLowerCase();
    let username = safeUsername(String(profile.name || profile.email.split('@')[0]));
    while (await db.user.findUnique({ where: { username } })) username = safeUsername(String(profile.name || 'user'));
    user = await db.user.create({ data: { email, displayName: String(profile.name || email.split('@')[0]).slice(0, 60), username, imageUrl: profile.picture ? String(profile.picture).slice(0, 1000) : null } });
  }
  await createSession(user.id);
  const response = NextResponse.redirect(new URL(isNew ? '/onboarding' : '/', url));
  return response;
}
