import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";

export async function GET() {
  try {
    const user = await ensureAppUser();
    const orders = await prisma.order.findMany({ where: { buyerId: user.id }, include: { items: { include: { product: { select: { title: true, secretPayload: true } } } }, payment: true }, orderBy: { createdAt: "desc" }, take: 100 });
    const safeOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { title: item.product.title, hasCredentials: Boolean(item.product.secretPayload) },
      })),
    }));
    return NextResponse.json({ ok: true, orders: safeOrders });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Authentication required" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { productId?: string } | null;
    if (!body?.productId) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    let buyer: Awaited<ReturnType<typeof ensureAppUser>> | null = null;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try { buyer = await ensureAppUser(); } catch {}
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: body.productId }, include: { seller: true } });
      if (!product || product.status !== "ACTIVE") throw new Error("Listing is no longer available");
      if (product.lockedAt && product.lockedAt > new Date()) throw new Error("This listing is currently in another checkout");
      if (product.lockedAt && product.lockedAt <= new Date()) await tx.product.update({ where: { id: product.id }, data: { lockedAt: null, lockedOrderId: null } }).catch(() => undefined);

      const total = Number(product.price);
      const commission = Math.round(total * 0.05 * 100) / 100;
      const sellerNet = Math.round((total - commission) * 100) / 100;
      const order = await tx.order.create({
        data: {
          buyerId: buyer?.id ?? null,
          status: "PENDING",
          subtotal: total,
          total,
          isGuest: !buyer,
          guestReference: buyer ? null : crypto.randomUUID(),
          commissionAmount: commission,
          sellerNetAmount: sellerNet,
          items: { create: { productId: product.id, sellerId: product.sellerId, price: product.price } },
          payout: { create: { sellerId: product.sellerId, amount: sellerNet, status: "HOLD" } },
        },
        select: { id: true, total: true, isGuest: true, guestReference: true, checkoutToken: true },
      });
      await tx.product.update({ where: { id: product.id }, data: { lockedAt: new Date(Date.now() + 60 * 60 * 1000), lockedOrderId: order.id } });
      return order;
    });

    return NextResponse.json({ ok: true, order: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create order" }, { status: 400 });
  }
}
