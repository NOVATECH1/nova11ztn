import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/security';
export async function GET(){try{await requireAdmin(); const [u,o,l]=await Promise.all([db.user.count(),db.storeOrder.count(),db.listing.count()]); const revenue=await db.storeOrder.aggregate({where:{status:'COMPLETED'},_sum:{price:true}}); return NextResponse.json({stats:[u,o,l,revenue._sum.price||0]});}catch(e:any){return NextResponse.json({error:e?.message==='FORBIDDEN'?'Forbidden':'Not authenticated'},{status:e?.message==='FORBIDDEN'?403:401});}}
