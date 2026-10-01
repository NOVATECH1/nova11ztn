import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, sameOrigin } from '@/lib/security';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:'Log in first.'},{status:401});
  const body=await req.json();
  const displayName=String(body.displayName||'').trim();
  const username=String(body.username||'');
  if(displayName.length<2 || displayName.length>60) return NextResponse.json({error:'Display name must be 2–60 characters.'},{status:400});
  if(!/^[A-Za-z0-9_.]{3,30}$/.test(username)) return NextResponse.json({error:'Username must use only letters, numbers, underscore and dot, with a maximum of 30 characters.'},{status:400});
  const conflict=await db.user.findFirst({where:{username,NOT:{id:user.id}},select:{id:true}});
  if(conflict) return NextResponse.json({error:'Username already used. Please choose another username.'},{status:409});
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      displayName,
      username,
      imageUrl: body.imageUrl ? String(body.imageUrl).slice(0,1000) : user.imageUrl,
    },
  });
  return NextResponse.json({ok:true,user:{displayName:updated.displayName,username:updated.username}});
}
