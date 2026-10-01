import { NextResponse } from 'next/server';
import { getPublicCheckout } from '@/lib/veritas';

// Proxied (not called straight from the browser) so we don't depend on
// Veritas allowing cross-origin requests from our domain.
export async function GET(_req: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  try {
    const checkout = await getPublicCheckout(linkId);
    return NextResponse.json({ ok: true, checkout });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Could not load payment details.' }, { status: 400 });
  }
}
