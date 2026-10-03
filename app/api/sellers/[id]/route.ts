import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productToView } from "@/lib/marketplace";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: { user: true, products: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, include: { seller: { include: { user: true } } } } },
  });
  if (!seller) return NextResponse.json({ ok: false, error: "Seller not found" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    seller: {
      id: seller.id,
      name: seller.user.name || seller.user.email || "Seller",
      bio: seller.user.bio || "",
      imageUrl: seller.user.imageUrl || null,
      rating: Number(seller.rating),
      verified: seller.verified || seller.user.kycStatus === "VERIFIED",
      badge: seller.badge,
      listings: seller.products.map(productToView),
    },
  });
}
