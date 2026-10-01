import { NextResponse } from 'next/server';
import { quoteInstagramPrice, isValidInstagramUsername, isValidInstagramPostUrl, type InstagramProduct } from '@/lib/instagram-pricing';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product = body.product as InstagramProduct;
  const qty = Number(body.qty);
  const target = String(body.target || '').trim();

  const quote = quoteInstagramPrice(product, qty);
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });

  const targetOk = product === 'followers' ? isValidInstagramUsername(target) : (isValidInstagramUsername(target) || isValidInstagramPostUrl(target));
  if (!targetOk) return NextResponse.json({ error: product === 'followers' ? 'Enter a valid Instagram username.' : 'Enter a valid Instagram username or post link.' }, { status: 400 });

  return NextResponse.json({ ok: true, priceBirr: quote.priceBirr, discountPct: quote.discountPct });
}
