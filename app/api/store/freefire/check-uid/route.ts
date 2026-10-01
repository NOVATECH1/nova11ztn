import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { requireUser, sameOrigin } from '@/lib/security';
import { checkFreeFireUid, FF_REGIONS } from '@/lib/hlgaming';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  if (!(await rateLimit(`ff-uid:${user.id}`, 20, 3600))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const uid = String(body.uid || '').trim();
  const region = String(body.region || '');
  if (!uid) return NextResponse.json({ error: 'Enter a Player ID.' }, { status: 400 });
  if (!FF_REGIONS.includes(region as any)) return NextResponse.json({ error: 'Choose a region.', regions: FF_REGIONS }, { status: 400 });

  const result = await checkFreeFireUid(uid, region as any);
  if (!result.ok) {
    // Checker is down or out of free quota — tell the frontend to fall back
    // to "type your UID twice + confirm" instead of blocking the order.
    return NextResponse.json({ available: false, reason: result.reason });
  }
  if (!result.valid) return NextResponse.json({ available: true, valid: false });
  return NextResponse.json({ available: true, valid: true, name: result.name, region: result.region, level: result.level });
}
