import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "FULFILLING"] },
      deliveredAt: { not: null },
      holdUntil: { lte: now },
    },
    select: { id: true },
    take: 100,
  });

  if (!expired.length) return NextResponse.json({ ok: true, completed: 0 });

  const ids = expired.map((x) => x.id);
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: {
        id: { in: ids },
        status: { in: ["PAID", "FULFILLING"] },
        deliveredAt: { not: null },
        holdUntil: { lte: now },
      },
      data: { status: "COMPLETED", completedAt: now },
    });

    await tx.payout.updateMany({
      where: { orderId: { in: ids }, order: { status: "COMPLETED" } },
      data: { status: "ELIGIBLE", eligibleAt: now },
    });

    return updated.count;
  });

  return NextResponse.json({ ok: true, completed: result });
}
