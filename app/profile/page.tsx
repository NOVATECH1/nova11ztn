import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/security';
import { UserBadges } from '@/app/components/badge';
type SubscriptionTierName = 'PREMIUM' | 'PREMIUM_PLUS';

export default async function ProfilePage(){
  const user = await getCurrentUser();
  if (!user) return <div className="page"><div className="container"><div className="card card-pad"><div className="eyebrow">Profile</div><h1>Sign in to view your profile</h1><Link className="btn btn-primary" href="/login">Log in</Link></div></div></div>;

  const active = await db.subscription.findFirst({
    where: { userId: user.id, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    include: { plan: true },
    orderBy: { endsAt: 'desc' },
  });
  const tier = active?.plan.tier ?? null;

  return <div className="page"><div className="container">
    <div className="card card-pad profile-header">
      <div className="profile-avatar">{user.displayName.slice(0,1).toUpperCase()}</div>
      <div className="profile-identity">
        <div className="eyebrow">Profile</div>
        <div className="profile-name-row"><h1>{user.displayName}</h1><UserBadges isVerified={user.isVerified} isOfficial={user.isOfficial} subscriptionTier={tier as SubscriptionTierName | null} interactive /></div>
        <p className="muted">@{user.username}</p>
        {user.bio && <p className="profile-bio">{user.bio}</p>}
      </div>
    </div>

    <div id="badge-meanings" className="section"><div className="section-head"><h2>Badge meanings</h2><span className="muted">Click or hover a badge for its meaning.</span></div>
      <div className="grid-2">
        <div className="card card-pad"><UserBadges isVerified /><strong>Verified</strong><p className="muted">Identity verification completed. This is separate from Premium access.</p></div>
        <div className="card card-pad"><UserBadges subscriptionTier='PREMIUM' /><strong>Premium</strong><p className="muted">Blue check only. No public “Premium” text is required beside the user name.</p></div>
        <div className="card card-pad"><UserBadges subscriptionTier='PREMIUM_PLUS' /><strong>Premium+</strong><p className="muted">Purple check only. No diamond icon is used.</p></div>
        <div className="card card-pad"><UserBadges isOfficial /><strong>Official</strong><p className="muted">Reserved for ZTN Official, with the red Official treatment.</p></div>
      </div>
    </div>

    <div className="section"><div className="grid-2">
      <div className="card card-pad"><h3>Security</h3><p className="muted">Trusted devices, password recovery and account protection.</p><Link className="btn" href="/kyc">Open KYC</Link></div>
      <div className="card card-pad"><h3>Seller access</h3><p className="muted">KYC is required to list on Marketplace and receive payouts.</p><button className="btn btn-primary">Seller setup</button></div>
    </div></div>
  </div></div>;
}
