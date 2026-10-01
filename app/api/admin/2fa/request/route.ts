import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { getCurrentUser, hash, sameOrigin } from '@/lib/security';
import { notifyAdmin } from '@/lib/email';

export async function POST(){
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  const user=await getCurrentUser();
  if(!user || user.role!=='ADMIN') return NextResponse.json({error:'Forbidden'},{status:403}); if(!(await rateLimit(`2fa-req:${user.id}`,3,600))) return tooMany();
  const code=String(crypto.randomInt(100000, 1000000));
  const challenge = await db.admin2FAChallenge.create({data:{userId:user.id,codeHash:hash(code),expiresAt:new Date(Date.now()+10*60*1000)}});
  await notifyAdmin({eventKey:`admin-2fa:${challenge.id}`,subject:'ZTN Admin security code',title:'Admin security code',htmlBody:`<p>Your ZTN Admin security code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,textBody:`Your ZTN Admin security code is ${code}. It expires in 10 minutes.`}).catch(()=>{});
  return NextResponse.json({ok:true,message:'A verification code was sent to the Admin email.'});
}
