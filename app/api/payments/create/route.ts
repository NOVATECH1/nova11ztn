import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { veritasRequest } from "@/lib/veritas";
import { ensureAppUser } from "@/lib/authz";

const LINK_TTL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { orderId?: string; storeOrderId?: string; checkoutToken?: string } | null;
    if (!body?.orderId && !body?.storeOrderId) return NextResponse.json({ ok: false, error: "orderId or storeOrderId is required" }, { status: 400 });

    let userId: string | null = null;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        userId = (await ensureAppUser()).id;
      } catch {}
    }

    const entity = body.orderId
      ? await prisma.order.findUnique({ where: { id: body.orderId }, include: { buyer: true, payment: true, items: true } })
      : await prisma.storeOrder.findUnique({ where: { id: body.storeOrderId! }, include: { buyer: true, payment: true } });

    if (!entity) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const isPending = entity.status === "PENDING";
    if (!isPending) return NextResponse.json({ ok: false, error: "Payment can only be created for a pending order." }, { status: 409 });

    if ("buyerId" in entity && entity.buyerId) {
      if (!userId || entity.buyerId !== userId) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
    } else if (!body.checkoutToken || body.checkoutToken !== entity.checkoutToken) {
      return NextResponse.json({ ok: false, error: "Checkout authorization is required" }, { status: 403 });
    }

    const existingPayment = entity.payment;
    if (existingPayment?.paymentLink && Date.now() - existingPayment.updatedAt.getTime() < LINK_TTL_MS) {
      return NextResponse.json({
        ok: true,
        checkoutUrl: existingPayment.paymentLink,
        paymentLinkId: existingPayment.providerRef ?? null,
        orderId: entity.id,
      });
    }

    const amount = Number("total" in entity ? entity.total : entity.amount);
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, error: "Invalid server-side order amount" }, { status: 400 });

    const name = `ZTN-${entity.id}`;
    const payoutAccountIds = [process.env.VERITAS_PAYOUT_TELEBIRR_ID, process.env.VERITAS_PAYOUT_CBE_ID].filter(Boolean);
    const created = await veritasRequest<{ paymentLink: { id: string; url?: string } }>("/payment-links", {
      method: "POST",
      body: JSON.stringify({
        name,
        customAmount: amount,
        acceptedProviders: ["telebirr", "cbe"],
        ...(payoutAccountIds.length ? { payoutAccountIds } : {}),
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payments/success?orderId=${entity.id}`,
        expiresInMinutes: 60,
      }),
    });

    const linkId = created.paymentLink.id;
    const url = created.paymentLink.url ?? `${process.env.VERITAS_API_URL ?? "https://verifyapi.leulzenebe.pro"}/payment-links/${linkId}/public`;

    if (body.orderId) {
      await prisma.payment.upsert({
        where: { orderId: entity.id },
        update: { paymentLink: url, providerRef: linkId, amount, status: "PENDING" },
        create: { orderId: entity.id, amount, paymentLink: url, providerRef: linkId, status: "PENDING" },
      });
    } else {
      await prisma.payment.upsert({
        where: { storeOrderId: entity.id },
        update: { paymentLink: url, providerRef: linkId, amount, status: "PENDING" },
        create: { storeOrderId: entity.id, amount, paymentLink: url, providerRef: linkId, status: "PENDING" },
      });
      await prisma.storeOrder.update({ where: { id: entity.id }, data: { paymentLinkId: linkId } });
    }

    return NextResponse.json({ ok: true, checkoutUrl: url, paymentLinkId: linkId, orderId: entity.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Checkout creation failed" }, { status: 502 });
  }
}
