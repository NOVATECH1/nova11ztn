import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  const raw = await req.text();
  const expectedSecret = process.env.BREVO_WEBHOOK_SECRET;
  if (expectedSecret) {
    const supplied = req.headers.get('x-ztn-webhook-secret') || '';
    const a = Buffer.from(expectedSecret);
    const b = Buffer.from(supplied);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }
  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const messageId = String(event['message-id'] || event.messageId || '');
  const status = String(event.event || 'UNKNOWN').toUpperCase();
  if (messageId) {
    await db.emailDelivery.updateMany({ where: { messageId }, data: { status } });
  }
  return NextResponse.json({ ok: true });
}
