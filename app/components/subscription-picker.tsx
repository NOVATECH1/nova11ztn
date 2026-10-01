"use client";
import { useMemo, useState } from 'react';
import { VeritasCheckout } from './veritas-checkout';

type Plan = { id:string; tier:'PREMIUM'|'PREMIUM_PLUS'; durationDays:number; price:number; label:string };

function labelForTier(tier: Plan['tier']) {
  return tier === 'PREMIUM_PLUS' ? 'Premium+' : 'Premium';
}

export function SubscriptionPicker({ plans }: { plans: Plan[] }) {
  const [selected, setSelected] = useState(plans.find((p) => p.durationDays === 30)?.id || plans[0]?.id || '');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState<{ id: string; amount: number } | null>(null);
  const [active, setActiveUntil] = useState<string | null>(null);
  const plan = useMemo(() => plans.find((p) => p.id === selected), [plans, selected]);

  async function start() {
    if (!selected) return;
    setStatus('Starting…');
    const r = await fetch('/api/subscriptions/purchase', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId: selected }),
    });
    const d = await r.json().catch(() => ({}));
    setStatus('');
    if (!r.ok) { setStatus(d.error || 'Unable to start purchase.'); return; }
    setPayment({ id: d.paymentId, amount: d.amount });
  }

  if (active) {
    return <div className="card card-pad"><p className="success" style={{ margin: 0 }}>Active until {active}.</p></div>;
  }

  if (payment && plan) {
    return <VeritasCheckout kind="subscription" orderId={payment.id} amount={payment.amount} onPaid={() => setActiveUntil(new Date(Date.now() + plan.durationDays * 86400000).toLocaleDateString())} />;
  }

  return <div className="subscription-picker">
    <div className="plan-grid">
      {plans.map((p) => {
        const popular = p.durationDays === 30;
        const isActive = p.id === selected;
        return <button key={p.id} type="button" className={`plan-card ${isActive ? 'selected' : ''}`} onClick={() => setSelected(p.id)} aria-pressed={isActive}>
          {popular && <span className="popular-label">Popular</span>}
          <span className="plan-duration">{p.label}</span>
          <strong className="plan-price">{p.price.toLocaleString('en-ET')} ETB</strong>
          <span className="plan-action">{isActive ? 'Selected' : 'Select'}</span>
        </button>;
      })}
    </div>

    {plan && <div className="card card-pad purchase-panel">
      <div className="purchase-panel-head">
        <div><span className="eyebrow">{labelForTier(plan.tier)}</span><h3>{plan.label}</h3><p className="muted">{plan.price.toLocaleString('en-ET')} ETB · KYC verified users only</p></div>
        {plan.durationDays === 30 && <span className="popular-label static">Popular</span>}
      </div>
      <button className="btn btn-primary" onClick={start}>Continue to payment</button>
      {status && <p className="danger" style={{ marginTop: 12 }}>{status}</p>}
    </div>}
  </div>;
}
