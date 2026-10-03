import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productToView } from "@/lib/marketplace";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { seller: { include: { user: true } } } });
  if (!product || product.status === "DELETED" || product.status === "SUSPENDED") return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
  return NextResponse.json({ ok: true, product: productToView(product) });
}
