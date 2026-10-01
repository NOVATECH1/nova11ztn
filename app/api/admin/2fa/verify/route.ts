import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hash, markAdmin2FAVerified, sameOrigin } from '@/lib/security';
export async function POST(req:Request){
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  const user=await getCurrentUser(); if(!user || user.role!=='ADMIN') return NextResponse.json({error:'Forbidden'},{status:403}); if(!(await rateLimit(`2fa-ver:${user.id}`,5,600))) return tooMany();
  const body=await req.json(); const code=String(body.code||''); if(!/^\d{6}$/.test(code)) return NextResponse.json({error:'Enter the 6-digit code.'},{status:400});
  const challenge=await db.admin2FAChallenge.findFirst({where:{userId:user.id,usedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'}}); if(!challenge||challenge.codeHash!==hash(code)) return NextResponse.json({error:'Invalid or expired code.'},{status:400});
  await db.admin2FAChallenge.update({where:{id:challenge.id},data:{usedAt:new Date()}}); await markAdmin2FAVerified(); return NextResponse.json({ok:true});
}
