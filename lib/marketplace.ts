import { prisma } from "@/lib/prisma";

export type ProductView = {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  sellerTier?: "Premium" | "Premium+" | "Official" | "Top Seller";
  level?: number;
  region?: string;
  uid?: string;
  image: string;
  featured?: boolean;
  verified: boolean;
  badge?: "Premium" | "Premium+" | "Official" | "Top Seller";
  rating?: number;
};

export function productToView(product: any): ProductView {
  const images = Array.isArray(product.images) ? product.images : [];
  const sellerName = product.seller?.user?.name || product.seller?.user?.email || "Seller";
  const tier = product.seller?.badge;
  const rawImage = typeof images[0] === "string" ? images[0] : "";
  const image = rawImage && /^https?:\/\//.test(rawImage) ? rawImage : rawImage && process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${rawImage}` : `/assets/game-account.svg`;
  return {
    id: product.id,
    title: product.title,
    category: product.category,
    price: Number(product.price),
    seller: sellerName,
    sellerTier: tier && tier !== "NONE" ? tier.replace("PREMIUM_PLUS", "Premium+").replace("PREMIUM", "Premium").replace("OFFICIAL", "Official").replace("TOP_SELLER", "Top Seller") as ProductView["sellerTier"] : undefined,
    level: product.level ?? undefined,
    region: product.region ?? undefined,
    uid: product.uid ?? undefined,
    image,
    featured: Boolean(product.featured),
    verified: Boolean(product.seller?.verified || product.seller?.user?.kycStatus === "VERIFIED"),
    badge: tier && tier !== "NONE" ? tier.replace("PREMIUM_PLUS", "Premium+").replace("PREMIUM", "Premium").replace("OFFICIAL", "Official").replace("TOP_SELLER", "Top Seller") as ProductView["badge"] : undefined,
    rating: product.seller?.rating != null ? Number(product.seller.rating) : undefined,
  };
}

export async function listProducts(opts: { category?: string; search?: string; limit?: number } = {}) {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(opts.category && opts.category !== "All" ? { category: opts.category } : {}),
      ...(opts.search ? { OR: [{ title: { contains: opts.search, mode: "insensitive" } }, { description: { contains: opts.search, mode: "insensitive" } }] } : {}),
    },
    include: { seller: { include: { user: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: opts.limit ?? 24,
  });
  return products.map(productToView);
}
