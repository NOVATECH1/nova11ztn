import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrdersScreen } from "@/components/screens";
export default async function Page(){
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <div style={{padding:40}}>Clerk is required for orders.</div>;
  const { userId } = await auth(); if (!userId) redirect("/sign-in");
  return <OrdersScreen/>;
}
