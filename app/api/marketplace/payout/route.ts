import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, sameOrigin } from '@/lib/security';
import { rateLimit, tooMany } from '@/lib/rate-limit';

const HOLD_MS = 24 * 60 * 60 * 1000; // payout protection: 24h after order is COMPLETED
const MIN_PAYOUT = 100;

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Log in first.' }, { status: 401 });
  if (!(await rateLimit(`payout:${user.id}`, 5, 3600))) return tooMany();
  if (user.kycStatus !== 'VERIFIED') return NextResponse.json({ error: 'KYC verification is required for payout.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount || 0);
  if (!Number.isInteger(amount) || amount < MIN_PAYOUT) return NextResponse.json({ error: `Minimum payout is ${MIN_PAYOUT} ETB.` }, { status: 400 });
  const method = body.method === 'CBE' ? 'CBE' : 'TELEBIRR';
  const cutoff = new Date(Date.now() - HOLD_MS);

  // Everything below runs in ONE transaction and locks this seller's row,
  // so two withdraw requests at the same time cannot both pass the balance check.
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const [released, inHold, used] = await Promise.all([
      tx.marketplaceOrder.aggregate({ where: { sellerId: user.id, status: 'COMPLETED', completedAt: { lte: cutoff } }, _sum: { price: true } }),
      tx.marketplaceOrder.aggregate({ where: { sellerId: user.id, status: 'COMPLETED', completedAt: { gt: cutoff } }, _sum: { price: true } }),
      tx.sellerPayout.aggregate({ where: { sellerId: user.id, status: { in: ['PENDING', 'SENT'] } }, _sum: { amount: true } }),
    ]);
    const available = Math.max(0, (released._sum.price || 0) - (used._sum.amount || 0));
    const held = inHold._sum.price || 0;
    if (amount > available) return { ok: false as const, available, held };
    const payout = await tx.sellerPayout.create({ data: { sellerId: user.id, amount, method } });
    return { ok: true as const, payout, availableAfter: available - amount, held };
  }, { timeout: 10000 });

  if (!result.ok) {
    const holdNote = result.held > 0 ? ` ${result.held} ETB is still in the 24-hour payout protection.` : '';
    return NextResponse.json({ error: `Available payout balance is ${result.available} ETB.${holdNote}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true, payout: result.payout, availableAfter: result.availableAfter, inProtection: result.held });
}
