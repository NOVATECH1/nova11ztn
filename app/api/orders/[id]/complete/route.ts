import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureAppUser();
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, include: { payout: { include: { seller: true } } } });
    if (!order || order.buyerId !== user.id) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (order.status === "DISPUTED") return NextResponse.json({ ok: false, error: "Disputed orders cannot be completed" }, { status: 409 });
    if (order.status !== "PAID" && order.status !== "FULFILLING") return NextResponse.json({ ok: false, error: "Order is not ready to complete" }, { status: 400 });
    if (!order.deliveredAt) return NextResponse.json({ ok: false, error: "The seller has not delivered this order yet." }, { status: 409 });

    const now = new Date();
    if (!order.holdUntil || order.holdUntil > now) return NextResponse.json({ ok: false, error: "The 24-hour confirmation window has not ended." }, { status: 400 });

    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id, status: { in: ["PAID", "FULFILLING"] }, deliveredAt: { not: null }, holdUntil: { lte: now } },
        data: { status: "COMPLETED", completedAt: now },
      });
      if (updated.count !== 1) return false;

      const payout = order.payout;
      const eligible = payout && Number(payout.amount) >= Number(payout.seller.payoutMin);
      await tx.payout.updateMany({ where: { orderId: id }, data: { eligibleAt: eligible ? now : null, status: eligible ? "ELIGIBLE" : "HOLD" } });
      return true;
    });

    if (!completed) return NextResponse.json({ ok: false, error: "Order could not be completed." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to complete order" }, { status: 401 });
  }
}
