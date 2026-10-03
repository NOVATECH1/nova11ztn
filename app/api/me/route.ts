import { NextResponse } from "next/server";
import { ensureAppUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await ensureAppUser();
    const listings = await prisma.product.findMany({ where: { sellerId: user.sellerProfile?.id, status: "ACTIVE" }, include: { seller: { include: { user: true } } }, orderBy: { createdAt: "desc" } });
    const activeSubscription = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE", expiresAt: { gt: new Date() } }, orderBy: { expiresAt: "desc" } });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl, bio: user.bio, kycStatus: user.kycStatus, role: user.role, seller: user.sellerProfile ? { rating: Number(user.sellerProfile.rating), sales: user.sellerProfile.totalSales, badge: user.sellerProfile.badge, verified: user.sellerProfile.verified } : null, subscription: activeSubscription ? { tier: activeSubscription.tier, expiresAt: activeSubscription.expiresAt } : null }, listings });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Authentication required" }, { status: 401 });
  }
}
