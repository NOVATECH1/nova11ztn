import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { requireUser, sameOrigin } from '@/lib/security';
import { confirmPayment } from '@/lib/veritas';
import { markPaidByPaymentLinkId } from '@/lib/order-payment';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  if (!(await rateLimit(`veritas-confirm:${user.id}`, 10, 600))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const linkId = String(body.linkId || '');
  const reference = String(body.reference || '').trim();
  const provider = body.provider === 'cbebirr' ? 'cbebirr' : 'telebirr';
  if (!linkId || !reference) return NextResponse.json({ error: 'Enter the payment reference.' }, { status: 400 });

  try {
    // Veritas checks the amount, destination and duplicate-reference itself.
    await confirmPayment(linkId, { reference, provider, buyerName: user.username, buyerPhone: body.buyerPhone ? String(body.buyerPhone) : undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'We could not verify that payment. Double check the reference and try again.' }, { status: 400 });
  }

  // Mark paid right away for a fast UI response. The webhook will also fire
  // and hit the same idempotent update, so nothing double-applies.
  const result = await markPaidByPaymentLinkId(linkId, null);
  if (!result.ok) return NextResponse.json({ error: 'Payment confirmed, but the matching order was not found. Contact support.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
