import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, sameOrigin } from '@/lib/security';
import { createPaymentLink } from '@/lib/veritas';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ztn.example';

/**
 * One route creates the payment link for all three payable things (store
 * order, marketplace order, subscription payment) so the Veritas wiring
 * lives in one place. `kind` + `orderId` say which table to look in.
 */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  if (!(await rateLimit(`veritas-create:${user.id}`, 10, 600))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || '');
  const orderId = String(body.orderId || '');

  let amount: number, name: string, redirectPath: string, already: string | null;

  if (kind === 'store') {
    const order = await db.storeOrder.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status !== 'PENDING_PAYMENT') return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 400 });
    amount = order.price; name = order.packageName || 'ZTN Store order'; redirectPath = `/store/orders/${order.id}`; already = order.paymentLinkId;
  } else if (kind === 'marketplace') {
    const order = await db.marketplaceOrder.findFirst({ where: { id: orderId, buyerId: user.id } });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status !== 'PENDING_PAYMENT') return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 400 });
    amount = order.price; name = `ZTN Marketplace order ${order.orderNumber}`; redirectPath = `/marketplace/orders/${order.id}`; already = order.paymentLinkId;
  } else if (kind === 'subscription') {
    const payment = await db.subscriptionPayment.findFirst({ where: { id: orderId, userId: user.id } });
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    if (payment.status !== 'PENDING') return NextResponse.json({ error: 'This payment is not pending.' }, { status: 400 });
    amount = payment.amount; name = 'ZTN Premium subscription'; redirectPath = `/subscription`; already = payment.paymentLinkId;
  } else {
    return NextResponse.json({ error: 'Unknown order kind.' }, { status: 400 });
  }

  if (already) return NextResponse.json({ ok: true, linkId: already });

  try {
    const link = await createPaymentLink({ name, amount, redirectUrl: `${SITE_URL}${redirectPath}` });
    if (kind === 'store') await db.storeOrder.update({ where: { id: orderId }, data: { paymentLinkId: link.id } });
    if (kind === 'marketplace') await db.marketplaceOrder.update({ where: { id: orderId }, data: { paymentLinkId: link.id } });
    if (kind === 'subscription') await db.subscriptionPayment.update({ where: { id: orderId }, data: { paymentLinkId: link.id } });
    return NextResponse.json({ ok: true, linkId: link.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not start payment.' }, { status: 400 });
  }
}
