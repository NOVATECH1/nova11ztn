import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeTopUpOrder } from "@/lib/waliya";
import { requireAdmin } from "@/lib/authz";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let adminId = "";
  let lockedByMe = false;
  try {
    const admin = await requireAdmin();
    adminId = admin.id;

    const locked = await prisma.storeOrder.updateMany({
      where: { id, kind: "FREE_FIRE", status: "PAID", providerRef: null },
      data: { status: "FULFILLING" },
    });
    if (locked.count !== 1) return NextResponse.json({ ok: false, error: "Order is not eligible or has already been sent" }, { status: 409 });
    lockedByMe = true;

    const order = await prisma.storeOrder.findUnique({ where: { id } });
    if (!order?.providerProductId || !order.providerServiceId) throw new Error("Provider details missing");

    const payload = (order.providerPayload ?? {}) as Record<string, unknown>;
    const result = await makeTopUpOrder({
      topUpId: order.providerProductId,
      serviceId: order.providerServiceId,
      playerId: String(payload.uid ?? order.target),
      zoneName: String(payload.zoneName ?? "") || undefined,
    });
    const message = result?.message;
    const providerRef = typeof message === "object" && message ? (message.utr ?? message.order_id ?? message.id) : undefined;

    await prisma.$transaction([
      prisma.storeOrder.update({
        where: { id },
        data: {
          status: "FULFILLING",
          providerRef: providerRef ? String(providerRef) : null,
          providerPayload: { ...payload, response: result },
        },
      }),
      prisma.auditLog.create({
        data: { actorId: adminId, action: "STORE_ORDER_FULFILLED", targetType: "StoreOrder", targetId: id, metadata: { providerRef: providerRef ?? null } },
      }),
    ]);

    return NextResponse.json({ ok: true, providerRef: providerRef ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Waliya failure";
    const existing = await prisma.storeOrder.findUnique({ where: { id }, select: { providerPayload: true } }).catch(() => null);
    const oldPayload = (existing?.providerPayload ?? {}) as Record<string, unknown>;
    // Only touch the order if THIS request locked it. Non-admin or invalid calls must change nothing.
    if (lockedByMe) {
      await prisma.storeOrder.update({
        where: { id },
        data: {
          status: "PAID",
          providerPayload: { ...oldPayload, error: message, failedAt: new Date().toISOString() },
        },
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
