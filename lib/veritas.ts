import crypto from 'node:crypto';

const BASE_URL = process.env.VERITAS_API_URL || 'https://verifyapi.leulzenebe.pro';

async function veritas<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const key = process.env.VERITAS_API_KEY;
  if (!key) throw new Error('VERITAS_NOT_CONFIGURED');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', 'x-api-key': key, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.error || `VERITAS_${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

/**
 * Creates one payment link per ZTN order. `reference` is OUR order id — stored
 * so the webhook can match the event back to the right order.
 */
export async function createPaymentLink(input: {
  name: string;
  amount: number; // ETB, whole birr
  redirectUrl: string;
  expiresInMinutes?: number;
}) {
  const payoutAccountId = process.env.VERITAS_PAYOUT_ACCOUNT_ID;
  if (!payoutAccountId) throw new Error('VERITAS_PAYOUT_ACCOUNT_NOT_CONFIGURED');
  const created = await veritas<{ paymentLink: { id: string }; secret?: string }>('/payment-links', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      customAmount: input.amount,
      acceptedProviders: ['telebirr', 'cbebirr'],
      payoutAccountIds: [payoutAccountId],
      redirectUrl: input.redirectUrl,
      expiresInMinutes: input.expiresInMinutes ?? 45,
    }),
  });
  return created.paymentLink;
}

export async function getPublicCheckout(linkId: string) {
  const res = await fetch(`${BASE_URL}/payment-links/${linkId}/public`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `VERITAS_PUBLIC_${res.status}`);
  return data;
}

/**
 * Confirms a buyer-submitted reference. Veritas itself checks the amount,
 * destination account, and that the reference was not already used — this
 * call does not need our API key (Veritas docs mark it "No API key"), but we
 * still call it from OUR server so we control what happens on success and so
 * the buyer never talks to Veritas directly with a spoofable amount.
 */
export async function confirmPayment(linkId: string, input: {
  reference: string;
  provider: 'telebirr' | 'cbebirr';
  buyerName?: string;
  buyerPhone?: string;
}) {
  const res = await fetch(`${BASE_URL}/payment-links/${linkId}/confirm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.error || 'Payment confirmation failed.');
    (err as any).status = res.status;
    throw err;
  }
  return data;
}

/** Verifies the raw webhook body against X-Veritas-Signature. Call BEFORE parsing JSON. */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | null): boolean {
  const secret = process.env.VERITAS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expected = `sha256=${expectedHex}`;
  const expectedBytes = Buffer.from(expected, 'utf8');
  const receivedBytes = Buffer.from(signatureHeader, 'utf8');
  return expectedBytes.length === receivedBytes.length && crypto.timingSafeEqual(expectedBytes, receivedBytes);
}

/**
 * The exact shape of a payment_link.paid event body has not been confirmed
 * against a real webhook delivery yet (Veritas docs list the event name and
 * signature scheme, but not a sample payload). This reads every plausible
 * field name so the webhook keeps working once the real shape is seen —
 * update this in one place if the real payload uses different keys.
 */
export function extractPaymentLinkEvent(event: any): { linkId: string | null; amount: number | null; eventId: string | null } {
  const data = event?.data ?? event;
  const linkId =
    data?.paymentLinkId ?? data?.paymentLink?.id ?? data?.linkId ?? data?.id ?? null;
  const amount =
    typeof data?.amount === 'number' ? data.amount :
    typeof data?.order?.amount === 'number' ? data.order.amount :
    typeof data?.customAmount === 'number' ? data.customAmount : null;
  const eventId = event?.id ?? event?.deliveryId ?? event?.eventId ?? null;
  return { linkId, amount, eventId };
}
