// HL Gaming Free Fire UID validation. Free plan: 750 checks/month (~25/day).
// Region is REQUIRED and case-sensitive — the wrong region reports "not valid"
// even for a real UID, so this is a best-effort helper, never a hard gate.

const REGIONS = ['IND', 'EU', 'NP', 'BD', 'SG', 'ME', 'TH', 'VN', 'ID', 'TW', 'RU', 'PK', 'US'] as const;
export type FFRegion = typeof REGIONS[number];
export const FF_REGIONS = REGIONS;

const cache = new Map<string, { at: number; result: any }>();
const CACHE_MS = 8 * 60 * 1000;

export async function checkFreeFireUid(uid: string, region: FFRegion): Promise<
  | { ok: true; valid: true; name: string; region: string; level: number }
  | { ok: true; valid: false }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'QUOTA_EXCEEDED' | 'UNAVAILABLE' }
> {
  const useruid = process.env.HLGAMING_USER_UID;
  const api = process.env.HLGAMING_API_KEY;
  if (!useruid || !api) return { ok: false, reason: 'NOT_CONFIGURED' };

  const cacheKey = `${uid}:${region}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.result;

  try {
    const url = new URL('https://proapis.hlgamingofficial.com/main/games/freefire/validation/api');
    url.searchParams.set('sectionName', 'freefireValidation');
    url.searchParams.set('useruid', useruid);
    url.searchParams.set('api', api);
    url.searchParams.set('uid', uid);
    url.searchParams.set('region', region);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (res.status === 429) return { ok: false, reason: 'QUOTA_EXCEEDED' };
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.result) return { ok: false, reason: 'UNAVAILABLE' };
    const result = data.result.valid
      ? { ok: true as const, valid: true as const, name: String(data.result.AccountName || ''), region: String(data.result.AccountRegion || region), level: Number(data.result.AccountLevel || 0) }
      : { ok: true as const, valid: false as const };
    cache.set(cacheKey, { at: Date.now(), result });
    return result;
  } catch {
    return { ok: false, reason: 'UNAVAILABLE' };
  }
}
