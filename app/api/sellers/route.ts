import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sellers = await prisma.sellerProfile.findMany({ where: { verified: true }, include: { user: true, _count: { select: { products: true } } }, orderBy: { rating: "desc" }, take: 50 });
  return NextResponse.json({ ok: true, sellers: sellers.map(s => ({ id: s.id, name: s.user.name || s.user.email || "Seller", badge: s.badge, rating: Number(s.rating), verified: true, listings: s._count.products })) });
}
