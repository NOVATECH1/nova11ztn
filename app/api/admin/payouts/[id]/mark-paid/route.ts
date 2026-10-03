import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin=await requireAdmin(); const {id}=await params;
    const payout=await prisma.payout.findUnique({where:{id},include:{order:true,seller:{include:{user:true}}}});
    if(!payout)return NextResponse.json({ok:false,error:'Payout not found'},{status:404});
    if(payout.status!=='ELIGIBLE')return NextResponse.json({ok:false,error:'Payout is not eligible'},{status:400});
    if(payout.order.status!=='COMPLETED')return NextResponse.json({ok:false,error:'Order must be completed'},{status:400});
    if(Number(payout.amount)<Number(payout.seller.payoutMin))return NextResponse.json({ok:false,error:`Minimum payout is ${Number(payout.seller.payoutMin)} ETB`},{status:400});
    const updated=await prisma.payout.updateMany({where:{id,status:'ELIGIBLE'},data:{status:'PAID'}});
    if(updated.count!==1)return NextResponse.json({ok:false,error:'Payout state changed'},{status:409});
    await prisma.auditLog.create({data:{actorId:admin.id,action:'PAYOUT_MARKED_PAID',targetType:'Payout',targetId:id}});
    if (payout.seller.user.email) {
      try {
        await sendBrevoEmail({ to: payout.seller.user.email, name: payout.seller.user.name ?? undefined, subject: "Your ZTN payout was sent", html: `<p>Your payout for order <strong>${payout.orderId}</strong> has been marked as paid.</p><p>Amount: <strong>${Number(payout.amount).toFixed(2)} ETB</strong>.</p>` });
      } catch {}
    }
    return NextResponse.json({ok:true});
  }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Unable to mark payout paid'},{status:401});}
}
