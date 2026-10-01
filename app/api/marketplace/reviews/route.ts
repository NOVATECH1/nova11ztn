import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, sameOrigin } from '@/lib/security';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  const body = await req.json();
  const order = await db.marketplaceOrder.findUnique({ where: { id: String(body.orderId || '') } });
  const stars = Number(body.stars);
  if (!order || order.buyerId !== user.id) return NextResponse.json({ error: 'Completed buyer order not found.' }, { status: 404 });
  if (order.status !== 'COMPLETED') return NextResponse.json({ error: 'You can review only completed orders.' }, { status: 400 });
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return NextResponse.json({ error: 'Stars must be from 1 to 5.' }, { status: 400 });
  const existing = await db.review.findUnique({ where: { marketplaceOrderId: order.id } });
  if (existing) return NextResponse.json({ error: 'This order already has a review.' }, { status: 409 });
  const review = await db.review.create({ data: { marketplaceOrderId: order.id, listingId: order.listingId, sellerId: order.sellerId, buyerId: user.id, stars, comment: body.comment ? String(body.comment).slice(0, 1000) : null } });
  return NextResponse.json({ ok: true, review });
}
