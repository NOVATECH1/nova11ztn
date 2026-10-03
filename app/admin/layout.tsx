import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.DATABASE_URL) redirect("/");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");
  return children;
}
