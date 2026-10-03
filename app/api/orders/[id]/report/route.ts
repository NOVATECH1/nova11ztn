import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null) as { checkoutToken?: string } | null;

    let userId: string | null = null;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        userId = (await ensureAppUser()).id;
      } catch {}
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { payout: true } });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const isBuyer = Boolean(userId && order.buyerId === userId);
    const isGuest = Boolean(!order.buyerId && body?.checkoutToken && body.checkoutToken === order.checkoutToken);
    if (!isBuyer && !isGuest) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });

    if (order.status !== "PAID" && order.status !== "FULFILLING") {
      return NextResponse.json({ ok: false, error: "A problem can only be reported before completion." }, { status: 409 });
    }

    const now = new Date();
    const reported = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id, status: { in: ["PAID", "FULFILLING"] } },
        data: { status: "DISPUTED", problemReportedAt: now },
      });
      if (updated.count !== 1) return false;
      await tx.payout.updateMany({ where: { orderId: id }, data: { status: "HOLD", eligibleAt: null } });
      return true;
    });

    if (!reported) return NextResponse.json({ ok: false, error: "Order was already changed and cannot be disputed now." }, { status: 409 });
    return NextResponse.json({ ok: true, status: "DISPUTED" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to report the order" }, { status: 400 });
  }
}
