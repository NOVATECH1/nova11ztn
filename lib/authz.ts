import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function requireClerkUser() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error("Authentication is not configured");
  }
  const { userId } = await auth();
  if (!userId) throw new Error("Authentication required");
  return userId;
}

export async function ensureAppUser() {
  const clerkId = await requireClerkUser();
  const existing = await prisma.user.findUnique({ where: { clerkId }, include: { sellerProfile: true } });
  if (existing) return existing;

  const me = await currentUser();
  if (!me) throw new Error("Authenticated Clerk user could not be loaded");
  const email = me.emailAddresses[0]?.emailAddress ?? null;
  return prisma.user.create({
    data: {
      clerkId,
      email,
      name: [me.firstName, me.lastName].filter(Boolean).join(" ") || me.username || null,
      imageUrl: me.imageUrl ?? null,
    },
    include: { sellerProfile: true },
  });
}

export async function requireAdmin() {
  const user = await ensureAppUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

export async function requireVerifiedSeller() {
  const user = await ensureAppUser();
  if (user.kycStatus !== "VERIFIED") throw new Error("KYC verification is required before selling");
  const seller = user.sellerProfile ?? await prisma.sellerProfile.create({ data: { userId: user.id, verified: true } });
  return { user, seller };
}
