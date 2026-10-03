import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureAppUser();
    const { id } = await params;
    const seller = user.sellerProfile;
    if (!seller) return NextResponse.json({ ok: false, error: "Seller profile not found" }, { status: 403 });

    const order = await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: { select: { secretPayload: true } } } } } });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (!order.items.some((item) => item.sellerId === seller.id)) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
    if (order.items.some((item) => item.product.secretPayload)) return NextResponse.json({ ok: false, error: "Orders with login details are delivered automatically when the buyer opens them." }, { status: 409 });
    if (order.status !== "PAID") return NextResponse.json({ ok: false, error: "Order must be PAID before delivery can be marked." }, { status: 409 });

    const deliveredAt = new Date();
    const updated = await prisma.order.updateMany({ where: { id, status: "PAID", deliveredAt: null }, data: { deliveredAt } });
    if (updated.count === 0) return NextResponse.json({ ok: true, delivered: true });
    return NextResponse.json({ ok: true, delivered: true, deliveredAt });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to mark delivered" }, { status: 401 });
  }
}
