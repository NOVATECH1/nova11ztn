import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/authz";
import { decryptSecret } from "@/lib/crypto";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const checkoutToken = url.searchParams.get("checkoutToken");

    let userId: string | null = null;
    if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        userId = (await ensureAppUser()).id;
      } catch {}
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        items: { include: { product: { select: { secretPayload: true } } } },
      },
    });

    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const isBuyer = Boolean(userId && order.buyerId === userId);
    const isGuest = Boolean(!order.buyerId && checkoutToken && checkoutToken === order.checkoutToken);
    if (!isBuyer && !isGuest) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });

    if (!["PAID", "FULFILLING", "COMPLETED"].includes(order.status) || order.payment?.status !== "VERIFIED") {
      return NextResponse.json({ ok: false, error: "Login details are not available until payment is verified." }, { status: 409 });
    }

    const secretPayload = order.items.find((item) => item.product.secretPayload)?.product.secretPayload;
    if (!secretPayload) return NextResponse.json({ ok: false, error: "This order has no login details." }, { status: 404 });

    let credentials: { email?: string; password?: string };
    try {
      credentials = JSON.parse(decryptSecret(secretPayload)) as { email?: string; password?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Stored login details could not be decrypted." }, { status: 500 });
    }

    if (order.deliveredAt === null) {
      await prisma.order.updateMany({ where: { id: order.id, deliveredAt: null }, data: { deliveredAt: new Date() } });
    }

    const response = NextResponse.json({ ok: true, email: credentials.email ?? "", password: credentials.password ?? "" });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load login details" }, { status: 401 });
  }
}
