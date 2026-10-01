import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyDiditSignature } from '@/lib/didit';

export async function POST(req:Request){
  const raw=await req.text();
  const sig=req.headers.get('x-signature-v2');
  const timestamp=req.headers.get('x-timestamp');
  if(!verifyDiditSignature(raw,sig,timestamp)) return NextResponse.json({error:'Invalid signature'},{status:401});
  let data:any={}; try{data=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})};
  const sessionId=String(data.session_id||''); const eventId=String(data.event_id||''); const status=String(data.status||'').toLowerCase();
  if(!sessionId) return NextResponse.json({ok:true});
  const kyc=await db.kycSession.findUnique({where:{diditSessionId:sessionId}});
  if(!kyc) return NextResponse.json({ok:true});
  if(eventId && kyc.lastEventId===eventId) return NextResponse.json({ok:true,duplicate:true});
  const approved=status==='approved'; const rejected=['declined','abandoned'].includes(status); const inReview=status==='in review'||status==='in_review'||status==='resubmitted'||status==='in progress'||status==='not started';
  await db.$transaction([
    db.kycSession.update({where:{id:kyc.id},data:{status:approved?'APPROVED':rejected?'DECLINED':inReview?'IN_REVIEW':'IN_REVIEW',rawEvent:data,lastEventId:eventId||null}}),
    db.user.update({where:{id:kyc.userId},data:{kycStatus:approved?'VERIFIED':rejected?'REJECTED':'IN_REVIEW'}})
  ]);
  return NextResponse.json({ok:true});
}
