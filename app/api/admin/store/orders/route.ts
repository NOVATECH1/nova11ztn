import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, sameOrigin } from '@/lib/security';
import { sendOrderStatusEmail } from '@/lib/email';

const transitions: Record<string, Set<string>> = {
  PENDING_PAYMENT: new Set(['PAYMENT_SUBMITTED','CANCELLED','FLAGGED']),
  PAYMENT_SUBMITTED: new Set(['PAYMENT_VERIFIED','CANCELLED','FLAGGED']),
  PAYMENT_VERIFIED: new Set(['PROCESSING','CANCELLED','FLAGGED','REFUND_PENDING']),
  PROCESSING: new Set(['COMPLETED','CANCELLED','FLAGGED','REFUND_PENDING']),
  COMPLETED: new Set(['REFUND_PENDING']),
  FLAGGED: new Set(['PAYMENT_SUBMITTED','PAYMENT_VERIFIED','PROCESSING','CANCELLED']),
  REFUND_PENDING: new Set(['REFUND_SENT']),
  CANCELLED: new Set(),
  REFUND_SENT: new Set(),
};

export async function GET() {
  try { await requireAdmin(); const orders = await db.storeOrder.findMany({ include:{user:{select:{email:true,displayName:true,username:true}},product:true,package:true}, orderBy:{createdAt:'desc'}, take:100 }); return NextResponse.json({orders}); }
  catch(e:any){ return NextResponse.json({error:e?.message==='FORBIDDEN'?'Forbidden':'Not authenticated'},{status:e?.message==='FORBIDDEN'?403:401}); }
}

export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const status = String(body.status || '');
    if (!Object.prototype.hasOwnProperty.call(transitions, status)) return NextResponse.json({error:'Invalid order status.'},{status:400});
    const order = await db.storeOrder.findUnique({where:{id:String(body.id||'')},include:{user:true,product:true,package:true}});
    if (!order) return NextResponse.json({error:'Order not found.'},{status:404});
    if (!transitions[order.status]?.has(status)) return NextResponse.json({error:`Cannot move order from ${order.status} to ${status}.`},{status:409});
    const updated = await db.storeOrder.update({where:{id:order.id},data:{status:status as any,adminNote:body.adminNote ? String(body.adminNote).slice(0,1000) : order.adminNote}});
    await db.auditLog.create({data:{actorUserId:admin.id,action:`STORE_ORDER_${status}`,targetType:'StoreOrder',targetId:order.id,metadata:{orderNumber:order.orderNumber}}});
    const emailEvents:any={
      PAYMENT_VERIFIED:['Payment verified','Your payment has been verified by ZTN.'],
      PROCESSING:['Order processing','Your order is now being processed by ZTN.'],
      COMPLETED:['Order completed','Your ZTN order has been completed.'],
      CANCELLED:['Order cancelled','Your ZTN order has been cancelled.'],
      REFUND_SENT:['Refund sent','Your refund has been marked as sent by ZTN.'],
    };
    if (order.user?.email && emailEvents[status]) {
      const [title,message]=emailEvents[status];
      await sendOrderStatusEmail({to:order.user.email,orderNumber:order.orderNumber,status,event:status,title,message}).catch(()=>{});
    }
    return NextResponse.json({ok:true,order:updated});
  } catch(e:any){ return NextResponse.json({error:e?.message||'Admin order action failed'},{status:e?.message==='FORBIDDEN'?403:400}); }
}
