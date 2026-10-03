import { NextResponse } from "next/server";
import { ensureAppUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const plans: Record<string, Record<number, number>> = {
  PREMIUM: { 7: 99, 30: 299, 90: 799, 180: 1399, 365: 2499 },
  PREMIUM_PLUS: { 7: 299, 30: 499, 90: 999, 180: 1599, 365: 2699 },
};

export async function POST(req: Request) {
  try {
    const user=await ensureAppUser();
    if (user.kycStatus !== "VERIFIED") return NextResponse.json({ok:false,error:"KYC verification is required before buying Premium."},{status:403});
    const body=await req.json().catch(()=>null) as {tier?:string;days?:number}|null;
    const tier=String(body?.tier??"").toUpperCase(); const days=Number(body?.days); const price=plans[tier]?.[days];
    if (!price) return NextResponse.json({ok:false,error:"Invalid subscription plan"},{status:400});
    const kind=tier === "PREMIUM_PLUS" ? "PREMIUM_PLUS" : "PREMIUM";
    const order=await prisma.storeOrder.create({data:{buyerId:user.id,kind,planDays:days,status:"PENDING",amount:price,currency:"ETB",target:user.id}});
    return NextResponse.json({ok:true,order:{id:order.id,amount:order.amount,kind:order.kind,planDays:order.planDays}});
  } catch(error) { return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Subscription order failed"},{status:401}); }
}
