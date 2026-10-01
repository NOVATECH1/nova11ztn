import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, sameOrigin } from '@/lib/security';
import { placeOrder, findOrderStatus } from '@/lib/waliya';

/**
 * Admin-triggered delivery — one button, "Send to Waliya" — instead of fully
 * automatic sending. Waliya gives no order id and no webhook, so a human
 * confirming the click (rather than a background job silently retrying) is
 * the safer starting point; this can move to automatic later.
 */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const admin = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '');
  const order = await db.storeOrder.findUnique({ where: { id: orderId }, include: { package: true } });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.status !== 'PAYMENT_VERIFIED' && order.status !== 'PROCESSING') {
    return NextResponse.json({ error: 'Order must be payment-verified first.' }, { status: 400 });
  }
  if (order.supplierOrderRef) return NextResponse.json({ error: 'This order was already sent to Waliya.' }, { status: 409 });
  const pkg = order.package;
  if (!pkg?.waliyaTopUpId || !pkg?.waliyaServiceId) return NextResponse.json({ error: 'This package has no Waliya product linked.' }, { status: 400 });
  const fulfillment = (order.fulfillmentData as any) || {};
  const playerId = String(fulfillment.playerId || fulfillment.uid || '');
  if (!playerId) return NextResponse.json({ error: 'This order has no Player ID.' }, { status: 400 });

  const placedAt = new Date();
  try {
    const result = await placeOrder({ topUpId: pkg.waliyaTopUpId, serviceId: pkg.waliyaServiceId, playerId, zoneName: fulfillment.zoneName });
    await db.storeOrder.update({
      where: { id: order.id },
      data: { status: 'PROCESSING', deliveryProvider: 'WALIYA', supplierOrderRef: placedAt.toISOString(), supplierStatus: 'SENT' },
    });
    await db.auditLog.create({ data: { actorUserId: admin.id, action: 'STORE_ORDER_SENT_TO_WALIYA', targetType: 'StoreOrder', targetId: order.id, metadata: { playerId } } });
    return NextResponse.json({ ok: true, waliya: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Waliya order failed.' }, { status: 400 });
  }
}

/** Checks Waliya's order list for this order's result and updates status if it changed. */
export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const orderId = String(searchParams.get('orderId') || '');
  const order = await db.storeOrder.findUnique({ where: { id: orderId } });
  if (!order?.supplierOrderRef) return NextResponse.json({ error: 'This order was not sent to Waliya yet.' }, { status: 400 });
  const fulfillment = (order.fulfillmentData as any) || {};
  const playerId = String(fulfillment.playerId || fulfillment.uid || '');
  const result = await findOrderStatus(playerId, new Date(order.supplierOrderRef));
  if (result.found) {
    await db.storeOrder.update({
      where: { id: order.id },
      data: {
        supplierStatus: result.status,
        status: result.status === 'COMPLETED' ? 'COMPLETED' : result.status === 'REFUNDED' || result.status === 'OUT_OF_STOCK' ? 'REFUND_PENDING' : order.status,
      },
    });
  }
  return NextResponse.json({ ok: true, result });
}
