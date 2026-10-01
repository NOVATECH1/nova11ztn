import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, sameOrigin } from '@/lib/security';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  const where:any = { status: 'ACTIVE' };
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { category: { contains: q, mode: 'insensitive' } }];
  const listings = await db.listing.findMany({ where, include: { seller: { select: { username: true, displayName: true, isVerified: true, isOfficial: true } } }, orderBy: [{ pinned: 'desc' }, { trendingScore: 'desc' }, { createdAt: 'desc' }], take: 40 });
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Log in first.' }, { status: 401 });
  if (!(await rateLimit(`listing:${user.id}`, 20, 3600))) return tooMany();
  if (user.kycStatus !== 'VERIFIED') return NextResponse.json({ error: 'KYC verification is required to sell on Marketplace.' }, { status: 403 });
  const body = await req.json();
  const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
  if (!body.title || !body.description || !body.category || !Number.isInteger(Number(body.price)) || Number(body.price) < 0) return NextResponse.json({ error: 'Invalid listing data.' }, { status: 400 });
  if (images.length > 3) return NextResponse.json({ error: 'Maximum 3 images.' }, { status: 400 });
  const listing = await db.listing.create({ data: { sellerId:user.id,title:String(body.title).trim(),description:String(body.description).trim(),category:String(body.category),type:body.type==='DM_SALE'?'DM_SALE':body.type==='DIGITAL'?'DIGITAL':'SERVICE',price:Number(body.price),images,digitalStorageId:body.digitalStorageId||null } });
  return NextResponse.json({ ok:true,listing });
}
