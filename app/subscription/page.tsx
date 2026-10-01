import Link from 'next/link';
import { subscriptionPlans } from '@/lib/config';
import { SubscriptionPicker } from '@/app/components/subscription-picker';

function TierIntro({ tier, title, description }: { tier: 'PREMIUM'|'PREMIUM_PLUS'; title: string; description: string }) {
  const isPlus = tier === 'PREMIUM_PLUS';
  return <section className={`subscription-section ${isPlus ? 'subscription-plus' : 'subscription-premium'}`}>
    <div className="section-head">
      <div><div className="eyebrow">{isPlus ? 'Premium+' : 'Premium'}</div><h2>{title}</h2><p className="muted">{description}</p></div>
      <Link className="btn" href="#badge-rules">Badge details</Link>
    </div>
    <div className="card card-pad tier-benefits">
      {isPlus ? <>
        <strong>Premium+ benefits</strong>
        <div className="benefit-grid"><span>Seller access after KYC</span><span>Higher-tier subscription badge</span><span>Premium+ marketplace eligibility</span></div>
      </> : <>
        <strong>Premium benefits</strong>
        <div className="benefit-grid"><span>Blue verification-style subscription mark</span><span>Premium listing duration</span><span>Additional account features</span></div>
      </>}
    </div>
    <SubscriptionPicker plans={subscriptionPlans.filter((p) => p.tier === tier)} />
  </section>;
}

export default function SubscriptionPage() {
  return <div className="page"><div className="container">
    <div className="hero compact-hero"><div className="eyebrow">Subscription</div><h1>Choose one tier at a time.</h1><p>Premium and Premium+ are separate subscription tiers. KYC is required to buy either tier. The 1-month plan is marked Popular in each tier.</p><div className="actions"><a className="btn btn-primary" href="#premium">View Premium</a><a className="btn" href="#premium-plus">View Premium+</a></div></div>
    <div id="premium"><TierIntro tier="PREMIUM" title="Premium" description="The standard paid tier with a blue check badge only." /></div>
    <div id="premium-plus"><TierIntro tier="PREMIUM_PLUS" title="Premium+" description="The higher paid tier with a purple check badge only." /></div>
    <section id="badge-rules" className="section"><div className="card card-pad"><strong>Badge rules</strong><p className="muted">Verified is independent identity verification. Premium shows a blue check only. Premium+ shows a purple check only. Official is reserved for ZTN Official.</p></div></section>
  </div></div>;
}
