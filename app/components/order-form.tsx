'use client';
import { useState } from 'react';
import Link from 'next/link';
import { VeritasCheckout } from './veritas-checkout';

const FF_REGIONS = ['ME', 'SG', 'IND', 'EU', 'NP', 'BD', 'TH', 'VN', 'ID', 'TW', 'RU', 'PK', 'US'];

export function OrderForm({ category, categorySlug, product, pkg }: { category: string; categorySlug: string; product: any; pkg: any }) {
  const isFreeFire = String(product.type || '').startsWith('FREE_FIRE');
  const [value, setValue] = useState('');
  const [region, setRegion] = useState('ME');
  const [uidCheck, setUidCheck] = useState<{ checked: boolean; valid?: boolean; name?: string; confirmedManually?: boolean; unavailable?: boolean }>({ checked: false });
  const [confirmTwice, setConfirmTwice] = useState('');
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState<{ id: string } | null>(null);
  const [paid, setPaid] = useState(false);

  async function checkUid() {
    if (!value.trim()) { setStatus(`Enter ${product.fieldLabel}.`); return; }
    setStatus('Checking Player ID…');
    const r = await fetch('/api/store/freefire/check-uid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid: value.trim(), region }),
    });
    const data = await r.json();
    setStatus('');
    if (!data.available) { setUidCheck({ checked: true, unavailable: true }); return; } // checker down — fall back to manual confirm
    if (!data.valid) { setUidCheck({ checked: true, valid: false }); return; }
    setUidCheck({ checked: true, valid: true, name: data.name });
  }

  async function createOrder() {
    if (!value.trim()) { setStatus(`Enter ${product.fieldLabel}.`); return; }
    if (isFreeFire) {
      const needsManualConfirm = !uidCheck.checked || uidCheck.unavailable || uidCheck.valid === false;
      if (uidCheck.valid === false) { setStatus('This Player ID was not found. Please check it and try again.'); return; }
      if (needsManualConfirm && confirmTwice.trim() !== value.trim()) {
        setStatus('Type your Player ID again to confirm it is correct.');
        return;
      }
    }
    setStatus('Creating order…');
    const fulfillmentData: Record<string, any> = { [product.fieldLabel]: value, playerId: value };
    if (isFreeFire) { fulfillmentData.zoneName = region; fulfillmentData.region = region; if (uidCheck.name) fulfillmentData.checkedName = uidCheck.name; }
    const r = await fetch('/api/store/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId: product.id, productSlug: product.slug, packageId: pkg.id, packageName: pkg.name, fulfillmentData }),
    });
    const data = await r.json();
    if (!r.ok) { setStatus(data.error || 'Unable to create order.'); return; }
    setOrder({ id: data.id });
    setStatus('');
  }

  if (paid) {
    return <div className="card form-card"><h2>Payment received ✅</h2><p className="muted">Your order is now processing. Check your order status for delivery updates.</p></div>;
  }

  if (order) {
    return <VeritasCheckout kind="store" orderId={order.id} amount={pkg.price} onPaid={() => setPaid(true)} />;
  }

  return (
    <>
      <Link className="back" href={`/store/${categorySlug}/${product.slug}`}>← Back to packages</Link>
      <div className="card form-card">
        <div className="eyebrow">Step 1 of 2</div>
        <h2>{product.name}</h2>
        <p className="muted">Enter your details, then continue to payment.</p>

        <div className="field">
          <label>{product.fieldLabel}</label>
          <input value={value} onChange={(e) => { setValue(e.target.value); setUidCheck({ checked: false }); }} placeholder={`Enter ${product.fieldLabel}`} />
        </div>

        {isFreeFire && (
          <>
            <div className="field">
              <label>Region</label>
              <select value={region} onChange={(e) => { setRegion(e.target.value); setUidCheck({ checked: false }); }}>
                {FF_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-small" onClick={checkUid} style={{ marginBottom: 14 }}>Check Player ID</button>
            {uidCheck.checked && uidCheck.valid && (
              <p className="success" style={{ marginBottom: 14 }}>✅ Found: {uidCheck.name}. Make sure this is your account.</p>
            )}
            {uidCheck.checked && uidCheck.valid === false && (
              <p className="danger" style={{ marginBottom: 14 }}>Player ID not found for region {region}. Try another region or check the ID.</p>
            )}
            {uidCheck.checked && uidCheck.unavailable && (
              <div className="field">
                <label>Type your Player ID again to confirm</label>
                <input value={confirmTwice} onChange={(e) => setConfirmTwice(e.target.value)} placeholder="Retype your Player ID" />
                <p className="muted" style={{ fontSize: 13 }}>We could not verify this automatically right now. Wrong Player ID = no refund.</p>
              </div>
            )}
          </>
        )}

        <div className="summary">
          <div className="summary-row"><span>Package</span><strong>{pkg.name}</strong></div>
          <div className="summary-row"><span>Price</span><strong>{pkg.price ? `${pkg.price} ETB` : 'Admin configured'}</strong></div>
        </div>
        <button className="btn btn-primary" onClick={createOrder}>Continue to payment</button>
        {status && <p className="danger" style={{ marginTop: 14 }}>{status}</p>}
      </div>
    </>
  );
}
