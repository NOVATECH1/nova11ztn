'use client';
import { useEffect, useState } from 'react';

type Props = {
  kind: 'store' | 'marketplace' | 'subscription';
  orderId: string;
  amount: number;
  onPaid: () => void;
};

/** Shared "pay with Veritas" step: create a payment link, show where to pay, confirm the reference. */
export function VeritasCheckout({ kind, orderId, amount, onPaid }: Props) {
  const [linkId, setLinkId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [provider, setProvider] = useState<'telebirr' | 'cbebirr'>('telebirr');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState('Preparing payment…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/payments/veritas/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, orderId }),
      });
      const data = await r.json();
      if (!r.ok) { setStatus(data.error || 'Could not start payment.'); return; }
      setLinkId(data.linkId);
      const pub = await fetch(`/api/payments/veritas/${data.linkId}/public`).then((x) => x.json()).catch(() => null);
      if (pub?.ok) setCheckout(pub.checkout);
      setStatus('');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    if (!linkId) return;
    if (!reference.trim()) { setStatus('Enter the payment reference number.'); return; }
    setBusy(true);
    setStatus('Checking your payment…');
    const r = await fetch('/api/payments/veritas/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ linkId, reference: reference.trim(), provider }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { setStatus(data.error || 'Payment could not be verified.'); return; }
    onPaid();
  }

  const payoutPhone = checkout?.payoutAccount?.account || checkout?.payoutAccount?.phone || null;
  const payoutLabel = checkout?.payoutAccount?.label || null;

  return (
    <div className="card form-card">
      <div className="eyebrow">Step 2 of 2</div>
      <h2>Pay {amount} ETB</h2>
      <div className="notice" style={{ marginBottom: 16 }}>
        <strong>How to pay</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          Send exactly <strong>{amount} ETB</strong> by Telebirr or CBE Birr
          {payoutPhone ? <> to <strong>{payoutPhone}</strong>{payoutLabel ? ` (${payoutLabel})` : ''}</> : ' to the ZTN account shown at checkout'}.
          Then type the transaction reference below.
        </p>
      </div>
      <div className="field">
        <label>Provider</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
          <option value="telebirr">Telebirr</option>
          <option value="cbebirr">CBE Birr</option>
        </select>
      </div>
      <div className="field">
        <label>Transaction reference</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. ABC123DE45" disabled={!linkId} />
      </div>
      <button className="btn btn-primary" onClick={confirm} disabled={!linkId || busy}>{busy ? 'Checking…' : 'I have paid'}</button>
      {status && <p className={status.startsWith('Checking') ? 'muted' : 'danger'} style={{ marginTop: 14 }}>{status}</p>}
    </div>
  );
}
