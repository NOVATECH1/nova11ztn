import { rateLimit, tooMany } from '@/lib/rate-limit';
import { ipAddress } from '@/lib/security';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  if (!(await rateLimit(`google:${await ipAddress()}`, 20, 600))) return tooMany();
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) return NextResponse.json({ error: 'Google OAuth is not configured.' }, { status: 503 });
  const state = crypto.randomBytes(24).toString('base64url');
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
  const jar = await cookies();
  jar.set('ztn_oauth_state', state, { httpOnly: true, secure: appUrl.startsWith('https://'), sameSite: 'lax', path: '/', maxAge: 600 });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
