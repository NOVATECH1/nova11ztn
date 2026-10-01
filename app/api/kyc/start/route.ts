import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, sameOrigin } from '@/lib/security';
import { createDiditSession } from '@/lib/didit';
export async function POST(){
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Log in first.'},{status:401}); if(!(await rateLimit(`kyc:${user.id}`,5,3600))) return tooMany(); try{const session=await createDiditSession(user.id); const id=String(session.session_id||''); if(!id) return NextResponse.json({error:'Didit did not return a session ID.'},{status:502}); await db.kycSession.create({data:{userId:user.id,diditSessionId:id,status:'NOT_STARTED',vendorData:user.id}}); return NextResponse.json({ok:true,url:session.url||null,sessionId:id});}catch(e:any){return NextResponse.json({error:'KYC provider is not configured or unavailable.'},{status:503});}}
