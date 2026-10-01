import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, sameOrigin } from '@/lib/security';

export async function GET() {
  const user = await requireUser();
  const orders = await db.marketplaceOrder.findMany({ where: { buyerId: user.id }, include: { listing: true, seller: { select: { username: true, displayName: true, isVerified: true, isOfficial: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireUser();
  if (!(await rateLimit(`morder:${user.id}`, 20, 600))) return tooMany();
  const body = await req.json();
  const listing = await db.listing.findUnique({ where: { id: String(body.listingId || '') } });
  if (!listing || listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing is unavailable.' }, { status: 404 });
  if (listing.sellerId === user.id) return NextResponse.json({ error: 'You cannot buy your own listing.' }, { status: 400 });
  const order = await db.marketplaceOrder.create({ data: { orderNumber: `MKT-${Date.now().toString().slice(-8)}`, listingId: listing.id, buyerId: user.id, sellerId: listing.sellerId, price: listing.price } });
  if (process.env.DEMO_MODE === 'true' && body.simulate === true) {
    const paid = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'PAID' } });
    return NextResponse.json({ ok: true, order: paid, simulated: true });
  }
  return NextResponse.json({ ok: true, order });
}
