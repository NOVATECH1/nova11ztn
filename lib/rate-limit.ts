import { NextResponse } from 'next/server';

// Fixed-window rate limiter.
// Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
// otherwise (or if Upstash is down) falls back to in-memory counting on this server.
type Bucket = { count: number; resetAt: number };
const mem = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  if (mem.size > 5000) for (const [k, b] of mem) if (b.resetAt < now) mem.delete(k);
  const b = mem.get(key);
  if (!b || b.resetAt < now) { mem.set(key, { count: 1, resetAt: now + windowSec * 1000 }); return true; }
  b.count += 1;
  return b.count <= limit;
}

async function upstashLimit(key: string, limit: number, windowSec: number): Promise<boolean | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, windowSec, 'NX']]),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result);
    if (!Number.isFinite(count)) return null;
    return count <= limit;
  } catch {
    return null;
  }
}

/** Returns true if the request is allowed, false if the limit is reached. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const k = `ztn:rl:${key}`;
  const remote = await upstashLimit(k, limit, windowSec);
  return remote === null ? memoryLimit(k, limit, windowSec) : remote;
}

export function tooMany() {
  return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429, headers: { 'Retry-After': '300' } });
}
