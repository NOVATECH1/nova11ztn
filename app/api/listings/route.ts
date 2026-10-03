import { NextResponse } from "next/server";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { requireVerifiedSeller } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const { user, seller } = await requireVerifiedSeller();
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const title = String(body?.title ?? "").trim();
    const category = String(body?.category ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const price = Number(body?.price);
    if (!title || !category || !description || !Number.isFinite(price) || price <= 0) return NextResponse.json({ ok: false, error: "Title, category, description and a valid price are required." }, { status: 400 });

    const images = Array.isArray(body?.images) ? body.images.filter((v): v is string => typeof v === "string").slice(0, 3) : [];
    for (const key of images) {
      if (!key.startsWith(`users/${user.clerkId}/`)) return NextResponse.json({ ok: false, error: "Invalid upload reference." }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const secretPayload = email || password ? encryptSecret(JSON.stringify({ email, password })) : null;
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        title,
        category,
        description,
        price,
        images,
        level: typeof body?.level === "number" ? body.level : null,
        uid: typeof body?.uid === "string" ? body.uid.trim() : null,
        region: typeof body?.region === "string" ? body.region.trim() : null,
        secretPayload,
      },
      select: { id: true, title: true, status: true, createdAt: true },
    });
    await prisma.sellerProfile.update({ where: { id: seller.id }, data: { totalListings: { increment: 1 } } });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create listing.";
    const status = /Authentication|KYC/i.test(message) ? 401 : /seller/i.test(message) ? 403 : /configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
