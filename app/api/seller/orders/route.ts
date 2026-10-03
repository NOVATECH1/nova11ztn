import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function GET() {
  try {
    const user = await ensureAppUser();
    if (!user.sellerProfile) return NextResponse.json({ ok: true, orders: [] });

    const orders = await prisma.order.findMany({
      where: { items: { some: { sellerId: user.sellerProfile.id } } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: { where: { sellerId: user.sellerProfile.id }, include: { product: { select: { title: true, secretPayload: true } } } },
        payout: true,
      },
    });

    return NextResponse.json({
      ok: true,
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        deliveredAt: order.deliveredAt,
        hasCredentials: order.items.some((item) => Boolean(item.product.secretPayload)),
        createdAt: order.createdAt,
        payoutStatus: order.payout?.status ?? "HOLD",
        items: order.items.map((item) => ({ title: item.product.title })),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Authentication required" }, { status: 401 });
  }
}
