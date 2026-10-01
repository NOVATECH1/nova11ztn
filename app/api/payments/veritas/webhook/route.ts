import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature, extractPaymentLinkEvent } from '@/lib/veritas';
import { markPaidByPaymentLinkId } from '@/lib/order-payment';

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('x-veritas-signature');
  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const { linkId, amount, eventId } = extractPaymentLinkEvent(event);

  // Dedupe: Veritas can and will redeliver the same event. If we've already
  // recorded this event id, do nothing — this is what makes retries safe.
  if (eventId) {
    try {
      await db.webhookEvent.create({ data: { source: 'veritas', eventKey: eventId } });
    } catch {
      return new Response(null, { status: 204 }); // already processed
    }
  }

  if (event.event !== 'payment_link.paid') {
    return new Response(null, { status: 204 });
  }
  if (!linkId) {
    // Payload shape didn't match what we expected — flag it for a human
    // instead of silently dropping a real payment.
    await db.webhookEvent.create({ data: { source: 'veritas', eventKey: `unmatched:${eventId || Date.now()}` } }).catch(() => {});
    console.error('VERITAS_WEBHOOK_UNRECOGNIZED_SHAPE', JSON.stringify(event));
    return new Response(null, { status: 204 });
  }

  const result = await markPaidByPaymentLinkId(linkId, amount);
  if (!result.ok) console.error('VERITAS_WEBHOOK_UNMATCHED', linkId, result.reason);
  return new Response(null, { status: 204 });
}
