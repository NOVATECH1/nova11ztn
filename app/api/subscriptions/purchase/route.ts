import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, sameOrigin } from '@/lib/security';

/**
 * Only creates the pending payment row. The buyer then calls
 * /api/payments/veritas/create (kind: 'subscription') to get a payment
 * link, pays, and /api/payments/veritas/confirm to finish — that shared
 * flow is what actually activates the subscription.
 */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  if (!(await rateLimit(`sub:${user.id}`, 10, 600))) return tooMany();
  if (user.kycStatus !== 'VERIFIED') return NextResponse.json({ error: 'KYC verification is required to buy Premium or Premium+.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const plan = await db.subscriptionPlan.findUnique({ where: { id: String(body.planId || '') } });
  if (!plan || !plan.active) return NextResponse.json({ error: 'Subscription plan is unavailable.' }, { status: 404 });

  const payment = await db.subscriptionPayment.create({ data: { userId: user.id, planId: plan.id, amount: plan.price } });
  return NextResponse.json({ ok: true, paymentId: payment.id, amount: plan.price });
}
