'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VeritasCheckout } from './veritas-checkout';

const STEP_QTY = 100;

export function InstagramOrderForm({ category, categorySlug, product }: { category: string; categorySlug: string; product: any }) {
  const isFollowers = product.type === 'INSTAGRAM_FOLLOWERS';
  const [qty, setQty] = useState(100);
  const [target, setTarget] = useState('');
  const [quote, setQuote] = useState<{ priceBirr: number; discountPct: number } | null>(null);
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState<{ id: string } | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      setStatus('');
      const r = await fetch('/api/store/instagram/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product: isFollowers ? 'followers' : 'likes', qty, target }),
      });
      const data = await r.json();
      if (!r.ok) { setQuote(null); if (target) setStatus(data.error); return; }
      setQuote({ priceBirr: data.priceBirr, discountPct: data.discountPct });
    }, 400);
    return () => clearTimeout(id);
  }, [qty, target, isFollowers]);

  async function createOrder() {
    if (!quote) { setStatus('Enter a valid username and quantity first.'); return; }
    setStatus('Creating order…');
    const r = await fetch('/api/store/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId: product.id, productSlug: product.slug, qty, fulfillmentData: { target } }),
    });
    const data = await r.json();
    if (!r.ok) { setStatus(data.error || 'Could not create order.'); return; }
    setOrder({ id: data.id });
    setStatus('');
  }

  if (paid) {
    return <div className="card form-card"><h2>Payment received ✅</h2><p className="muted">Your order is being delivered. Delivery usually takes up to 24 hours or a little more.</p></div>;
  }

  if (order) {
    return <VeritasCheckout kind="store" orderId={order.id} amount={quote!.priceBirr} onPaid={() => setPaid(true)} />;
  }

  return (
    <>
      <Link className="back" href={`/store/${categorySlug}/${product.slug}`}>← Back</Link>
      <div className="card form-card">
        <div className="eyebrow">Step 1 of 2</div>
        <h2>{product.name}</h2>
        <div className="field">
          <label>{isFollowers ? 'Instagram username' : 'Instagram username or post link'}</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={isFollowers ? '@yourusername' : '@yourusername or a post link'} />
        </div>
        <div className="field">
          <label>Quantity (steps of {STEP_QTY}, max 5000)</label>
          <input type="number" min={100} max={5000} step={STEP_QTY} value={qty} onChange={(e) => setQty(Math.max(100, Math.min(5000, Math.round(Number(e.target.value) / STEP_QTY) * STEP_QTY)))} />
        </div>
        <div className="notice" style={{ marginBottom: 16 }}>
          <strong>Account must be public.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>Wrong username or a private account cannot be delivered, and is not refundable. Delivery within 24 hours or a little more.</p>
        </div>
        <div className="summary">
          <div className="summary-row"><span>Quantity</span><strong>{qty}</strong></div>
          <div className="summary-row"><span>Discount</span><strong>{quote ? `${quote.discountPct}%` : '—'}</strong></div>
          <div className="summary-row"><span>Price</span><strong>{quote ? `${quote.priceBirr} ETB` : '—'}</strong></div>
        </div>
        <button className="btn btn-primary" onClick={createOrder} disabled={!quote}>Continue to payment</button>
        {status && <p className="danger" style={{ marginTop: 14 }}>{status}</p>}
      </div>
    </>
  );
}
