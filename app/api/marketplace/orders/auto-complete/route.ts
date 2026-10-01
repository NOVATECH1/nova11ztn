import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const secret = process.env.MARKETPLACE_AUTOCOMPLETE_SECRET || process.env.AUTO_COMPLETE_SECRET;
  if (!secret || req.headers.get('x-ztn-cron-secret') !== secret) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db.marketplaceOrder.updateMany({ where: { status: 'DELIVERED', deliveredAt: { lte: cutoff } }, data: { status: 'COMPLETED', completedAt: new Date() } });
  return NextResponse.json({ ok: true, completed: result.count });
}
