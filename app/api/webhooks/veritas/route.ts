import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { makeTopUpOrder } from "@/lib/waliya";
import { veritasRequest } from "@/lib/veritas";
import { sendBrevoEmail } from "@/lib/brevo";

function validSignature(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.replace(/^sha256=/, ""), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function pick(obj: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((a: any, k) => a?.[k], obj);
    if (value != null) return value;
  }
  return undefined;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.VERITAS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 503 });

  const signature = req.headers.get("X-Veritas-Signature") ?? req.headers.get("x-veritas-signature") ?? "";
  if (!validSignature(raw, signature, secret)) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(pick(payload, ["event", "type", "name"]) ?? "");
  if (event !== "payment_link.paid") return NextResponse.json({ ok: true, ignored: true });

  const paymentLinkId = String(pick(payload, ["payment_link.id", "paymentLink.id", "data.payment_link.id", "data.paymentLink.id", "payment_link_id", "paymentLinkId"]) ?? "");
  const providerRef = String(pick(payload, ["reference", "data.reference", "order.reference", "payment.reference"]) ?? "");
  let paidAmount = Number(pick(payload, ["amount", "data.amount", "order.amount", "payment.amount", "payment_link.amount"]));

  if (!Number.isFinite(paidAmount) && paymentLinkId) {
    try {
      const link = await veritasRequest<any>(`/payment-links/${encodeURIComponent(paymentLinkId)}`);
      paidAmount = Number(pick(link, ["paymentLink.customAmount", "paymentLink.amount", "customAmount", "amount"]));
    } catch {}
  }

  const payment = paymentLinkId
    ? await prisma.payment.findFirst({ where: { providerRef: paymentLinkId } })
    : providerRef
      ? await prisma.payment.findFirst({ where: { providerRef } })
      : null;

  if (!payment) return NextResponse.json({ ok: true, received: true });
  if (!Number.isFinite(paidAmount) || Math.round(paidAmount * 100) !== Math.round(Number(payment.amount) * 100)) {
    return NextResponse.json({ ok: false, error: "Payment amount mismatch or amount unavailable" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "VERIFIED" } },
      data: {
        status: "VERIFIED",
        providerRef: providerRef || payment.providerRef,
        metadata: payload,
      },
    });

    if (claimed.count !== 1) return { duplicate: true as const };

    const p = await tx.payment.findUnique({ where: { id: payment.id } });
    if (!p) return { duplicate: true as const };

    if (p.orderId) {
      const order = await tx.order.update({
        where: { id: p.orderId },
        data: {
          status: "PAID",
          holdUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: { items: true, payout: true },
      });

      await tx.product.updateMany({
        where: { id: { in: order.items.map((i) => i.productId) }, lockedOrderId: order.id },
        data: { status: "SOLD", lockedAt: null, lockedOrderId: null },
      });

      if (order.payout) {
        await tx.payout.update({
          where: { id: order.payout.id },
          data: { eligibleAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        });
      }

      const sellerIds = [...new Set(order.items.map((item) => item.sellerId))];
      for (const sellerId of sellerIds) {
        await tx.sellerProfile.update({
          where: { id: sellerId },
          data: {
            totalSales: { increment: 1 },
            balanceDisplay: { increment: order.sellerNetAmount },
          },
        });
      }

      return { kind: "marketplace" as const, orderId: order.id };
    }

    if (p.storeOrderId) {
      const current = await tx.storeOrder.findUnique({ where: { id: p.storeOrderId } });
      if (!current) return null;

      if (current.kind === "PREMIUM" || current.kind === "PREMIUM_PLUS") {
        const tier = current.kind === "PREMIUM_PLUS" ? "PREMIUM_PLUS" : "PREMIUM";
        if (!current.planDays) throw new Error("Subscription duration missing");

        const existing = await tx.subscription.findFirst({
          where: {
            userId: current.buyerId ?? current.target,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { expiresAt: "desc" },
        });
        const now = new Date();
        const start = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
        const expires = new Date(start.getTime() + current.planDays * 24 * 60 * 60 * 1000);

        if (!existing) {
          await tx.subscription.create({
            data: {
              userId: current.buyerId ?? current.target,
              tier: tier as any,
              status: "ACTIVE",
              startedAt: now,
              expiresAt: expires,
              price: current.amount,
            },
          });
        } else {
          await tx.subscription.update({
            where: { id: existing.id },
            data: { tier: tier as any, expiresAt: expires, price: current.amount, status: "ACTIVE" },
          });
        }

        const order = await tx.storeOrder.update({
          where: { id: current.id },
          data: { status: "COMPLETED", fulfillmentAt: now },
        });

        return {
          kind: "store" as const,
          storeOrderId: order.id,
          storeKind: order.kind,
          providerPayload: order.providerPayload,
          providerProductId: null,
          providerServiceId: null,
          target: order.target,
        };
      }

      const nextStatus = current.kind === "INSTAGRAM_FOLLOWERS" || current.kind === "INSTAGRAM_LIKES" ? "MANUAL_REVIEW" : "PAID";
      const order = await tx.storeOrder.update({ where: { id: p.storeOrderId }, data: { status: nextStatus } });
      return {
        kind: "store" as const,
        storeOrderId: order.id,
        storeKind: order.kind,
        providerPayload: order.providerPayload,
        providerProductId: order.providerProductId,
        providerServiceId: order.providerServiceId,
        target: order.target,
      };
    }

    return null;
  });

  if (updated?.duplicate) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (updated?.kind === "marketplace") {
      const order = await prisma.order.findUnique({ where: { id: updated.orderId }, include: { buyer: true } });
      if (order?.buyer?.email) {
        await sendBrevoEmail({
          to: order.buyer.email,
          name: order.buyer.name ?? undefined,
          subject: "ZTN payment confirmed",
          html: `<p>Your ZTN payment for order <strong>${order.id}</strong> was verified.</p><p>Order status: PAID.</p>`,
        });
      }
    } else if (updated?.kind === "store" && updated.storeOrderId) {
      const order = await prisma.storeOrder.findUnique({ where: { id: updated.storeOrderId }, include: { buyer: true } });
      if (order?.buyer?.email) {
        await sendBrevoEmail({
          to: order.buyer.email,
          name: order.buyer.name ?? undefined,
          subject: "ZTN store payment confirmed",
          html: `<p>Your ZTN Store payment for order <strong>${order.id}</strong> was verified.</p><p>Current order status: ${order.status}.</p>`,
        });
      }
    }
  } catch {}

  if (updated?.kind === "store" && updated.storeKind === "FREE_FIRE" && updated.providerProductId && updated.providerServiceId) {
    const locked = await prisma.storeOrder.updateMany({
      where: { id: updated.storeOrderId, status: "PAID", providerRef: null },
      data: { status: "FULFILLING" },
    });

    if (locked.count === 1) {
      try {
        const meta = (updated.providerPayload ?? {}) as Record<string, unknown>;
        const result = await makeTopUpOrder({
          topUpId: updated.providerProductId,
          serviceId: updated.providerServiceId,
          playerId: String(meta.uid ?? updated.target),
          zoneName: String(meta.zoneName ?? "") || undefined,
        });
        const m = result?.message;
        const utr = typeof m === "object" && m ? (m.utr ?? m.order_id ?? m.id) : undefined;
        await prisma.storeOrder.update({
          where: { id: updated.storeOrderId },
          data: {
            status: "FULFILLING",
            providerRef: utr ? String(utr) : null,
            providerPayload: { ...meta, submittedAt: new Date().toISOString(), waliya: result },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Waliya delivery failed";
        const oldPayload = (updated.providerPayload ?? {}) as Record<string, unknown>;
        await prisma.storeOrder.update({
          where: { id: updated.storeOrderId },
          data: {
            status: "PAID",
            providerPayload: { ...oldPayload, error: message, failedAt: new Date().toISOString() },
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, received: true });
}
