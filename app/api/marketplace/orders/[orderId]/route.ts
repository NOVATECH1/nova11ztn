import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, sameOrigin } from '@/lib/security';

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  const { orderId } = await params;
  const body = await req.json();
  const order = await db.marketplaceOrder.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });


  if (body.action === 'cancel') {
    if (order.buyerId !== user.id || order.status !== 'PENDING_PAYMENT') return NextResponse.json({ error: 'Cancellation is not available.' }, { status: 403 });
    const updated = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ ok: true, order: updated });
  }

  if (body.action === 'deliver') {
    if (order.sellerId !== user.id || order.status !== 'PAID') return NextResponse.json({ error: 'Delivery is not available.' }, { status: 403 });
    const updated = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
    return NextResponse.json({ ok: true, order: updated });
  }

  if (body.action === 'confirm') {
    if (order.buyerId !== user.id || !['PAID', 'DELIVERED'].includes(order.status)) return NextResponse.json({ error: 'Confirmation is not available.' }, { status: 403 });
    const updated = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    return NextResponse.json({ ok: true, order: updated });
  }

  if (body.action === 'dispute') {
    if (order.buyerId !== user.id || !['PAID', 'DELIVERED'].includes(order.status)) return NextResponse.json({ error: 'Dispute is not available.' }, { status: 403 });
    const updated = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'DISPUTED', disputeReason: String(body.reason || 'Buyer dispute').slice(0, 500) } });
    return NextResponse.json({ ok: true, order: updated });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
