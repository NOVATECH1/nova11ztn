import { db } from '@/lib/db';
import { sendSubscriptionActivatedEmail } from '@/lib/email';

/**
 * Marks whichever order owns this Veritas payment link as paid. Idempotent:
 * the `updateMany` only succeeds from the order's current "awaiting payment"
 * status, so calling this twice for the same order (confirm response + the
 * webhook, or two webhook retries) does nothing the second time.
 */
export async function markPaidByPaymentLinkId(linkId: string, verifiedAmount: number | null) {
  const storeOrder = await db.storeOrder.findUnique({ where: { paymentLinkId: linkId } });
  if (storeOrder) {
    if (verifiedAmount != null && verifiedAmount !== storeOrder.price) {
      return { ok: false as const, reason: 'AMOUNT_MISMATCH' };
    }
    const result = await db.storeOrder.updateMany({
      where: { id: storeOrder.id, status: { in: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'] } },
      data: { status: 'PAYMENT_VERIFIED', paymentMethod: 'VERITAS' },
    });
    return { ok: true as const, already: result.count === 0, kind: 'store' as const, id: storeOrder.id };
  }

  const mpOrder = await db.marketplaceOrder.findUnique({ where: { paymentLinkId: linkId } });
  if (mpOrder) {
    if (verifiedAmount != null && verifiedAmount !== mpOrder.price) {
      return { ok: false as const, reason: 'AMOUNT_MISMATCH' };
    }
    const result = await db.marketplaceOrder.updateMany({
      where: { id: mpOrder.id, status: 'PENDING_PAYMENT' },
      data: { status: 'PAID' },
    });
    return { ok: true as const, already: result.count === 0, kind: 'marketplace' as const, id: mpOrder.id };
  }

  const payment = await db.subscriptionPayment.findUnique({ where: { paymentLinkId: linkId }, include: { plan: true, user: true } });
  if (payment) {
    if (verifiedAmount != null && verifiedAmount !== payment.amount) {
      return { ok: false as const, reason: 'AMOUNT_MISMATCH' };
    }
    if (payment.status === 'ACTIVATED') return { ok: true as const, already: true, kind: 'subscription' as const, id: payment.id };
    const result = await db.subscriptionPayment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'VERIFIED' } });
    if (result.count === 0) return { ok: true as const, already: true, kind: 'subscription' as const, id: payment.id };

    const now = new Date();
    const current = await db.subscription.findFirst({ where: { userId: payment.userId }, orderBy: { endsAt: 'desc' } });
    const startsAt = current?.endsAt && current.endsAt > now ? current.endsAt : now;
    const endsAt = new Date(startsAt.getTime() + payment.plan.durationDays * 86400000);
    await db.subscription.create({ data: { userId: payment.userId, planId: payment.planId, startsAt, endsAt, gifted: false, paymentRef: payment.id } });
    await db.subscriptionPayment.update({ where: { id: payment.id }, data: { status: 'ACTIVATED' } });
    await sendSubscriptionActivatedEmail({ to: payment.user.email, tier: payment.plan.tier, durationLabel: payment.plan.label, price: payment.plan.price, paymentRef: payment.id }).catch(() => {});
    return { ok: true as const, already: false, kind: 'subscription' as const, id: payment.id };
  }

  return { ok: false as const, reason: 'ORDER_NOT_FOUND' };
}
