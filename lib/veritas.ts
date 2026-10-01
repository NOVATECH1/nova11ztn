import crypto from 'node:crypto';

const BASE_URL =
  process.env.VERITAS_API_URL || 'https://verifyapi.leulzenebe.pro';

async function veritas<T = any>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const key = process.env.VERITAS_API_KEY;

  if (!key) {
    throw new Error('VERITAS_NOT_CONFIGURED');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      ...(opts.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    const err = new Error(
      data?.error || `VERITAS_${res.status}`,
    );

    (err as any).status = res.status;
    (err as any).data = data;

    throw err;
  }

  return data;
}

/**
 * Creates one payment link per ZTN order.
 *
 * Supports:
 * - Telebirr
 * - CBE bank
 *
 * The payout accounts are configured separately in Render:
 * VERITAS_TELEBIRR_PAYOUT_ACCOUNT_ID
 * VERITAS_CBE_PAYOUT_ACCOUNT_ID
 */
export async function createPaymentLink(input: {
  name: string;
  amount: number;
  redirectUrl: string;
  expiresInMinutes?: number;
}) {
  const telebirrPayoutAccountId =
    process.env.VERITAS_TELEBIRR_PAYOUT_ACCOUNT_ID;

  const cbePayoutAccountId =
    process.env.VERITAS_CBE_PAYOUT_ACCOUNT_ID;

  if (!telebirrPayoutAccountId || !cbePayoutAccountId) {
    throw new Error('VERITAS_PAYOUT_ACCOUNTS_NOT_CONFIGURED');
  }

  const created = await veritas<{
    paymentLink: {
      id: string;
      secret?: string;
    };
    secret?: string;
  }>('/payment-links', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      customAmount: input.amount,

      // ZTN supports Telebirr and CBE bank.
      acceptedProviders: ['telebirr', 'cbe'],

      // Both payout destinations are available to the payment link.
      payoutAccountIds: [
        telebirrPayoutAccountId,
        cbePayoutAccountId,
      ],

      redirectUrl: input.redirectUrl,

      expiresInMinutes:
        input.expiresInMinutes ?? 45,
    }),
  });

  return created.paymentLink;
}

export async function getPublicCheckout(linkId: string) {
  const res = await fetch(
    `${BASE_URL}/payment-links/${linkId}/public`,
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.error || `VERITAS_PUBLIC_${res.status}`,
    );
  }

  return data;
}

/**
 * Confirms a buyer-submitted payment reference.
 *
 * Veritas checks:
 * - payment amount
 * - destination account
 * - reference validity
 * - duplicate reference usage
 *
 * This request is made server-side by ZTN.
 */
export async function confirmPayment(
  linkId: string,
  input: {
    reference: string;
    provider: 'telebirr' | 'cbe';
    buyerName?: string;
    buyerPhone?: string;
  },
) {
  const res = await fetch(
    `${BASE_URL}/payment-links/${linkId}/confirm`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    const err = new Error(
      data?.error || 'Payment confirmation failed.',
    );

    (err as any).status = res.status;

    throw err;
  }

  return data;
}

/**
 * Verifies the raw Veritas webhook body.
 *
 * IMPORTANT:
 * The raw body must be used before JSON parsing.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.VERITAS_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expected = `sha256=${expectedHex}`;

  const expectedBytes = Buffer.from(
    expected,
    'utf8',
  );

  const receivedBytes = Buffer.from(
    signatureHeader,
    'utf8',
  );

  return (
    expectedBytes.length === receivedBytes.length &&
    crypto.timingSafeEqual(
      expectedBytes,
      receivedBytes,
    )
  );
}

/**
 * Extracts the important information from a
 * payment_link.paid webhook event.
 *
 * Supports several possible payload shapes so the
 * webhook can handle the actual Veritas event format.
 */
export function extractPaymentLinkEvent(
  event: any,
): {
  linkId: string | null;
  amount: number | null;
  eventId: string | null;
} {
  const data = event?.data ?? event;

  const linkId =
    data?.paymentLinkId ??
    data?.paymentLink?.id ??
    data?.linkId ??
    data?.id ??
    null;

  const amount =
    typeof data?.amount === 'number'
      ? data.amount
      : typeof data?.order?.amount === 'number'
        ? data.order.amount
        : typeof data?.customAmount === 'number'
          ? data.customAmount
          : null;

  const eventId =
    event?.id ??
    event?.deliveryId ??
    event?.eventId ??
    null;

  return {
    linkId,
    amount,
    eventId,
  };
}
