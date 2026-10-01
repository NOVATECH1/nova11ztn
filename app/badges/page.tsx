import Link from 'next/link';
import { UserBadges } from '@/app/components/badge';

export default function BadgeGuidePage(){
  return <div className="page"><div className="container">
    <div className="hero compact-hero">
      <div className="eyebrow">ZTN badge guide</div>
      <h1>What each badge means</h1>
      <p className="muted">Badges describe identity verification, active subscription status, or the official ZTN account.</p>
    </div>
    <div className="grid-2">
      <div className="card card-pad"><UserBadges isVerified /><h3>Verified</h3><p className="muted">Green verification mark. Identity verification has been completed. Verified status is separate from Premium access.</p></div>
      <div className="card card-pad"><UserBadges subscriptionTier="PREMIUM" /><h3>Premium</h3><p className="muted">Blue verification mark only. ZTN does not show a public Premium label beside the user's name.</p></div>
      <div className="card card-pad"><UserBadges subscriptionTier="PREMIUM_PLUS" /><h3>Premium+</h3><p className="muted">Purple verification mark only. No diamond icon is used.</p></div>
      <div className="card card-pad"><UserBadges isOfficial /><h3>Official</h3><p className="muted">Reserved for ZTN Official. It uses the red official mark with a white check and the Official label.</p></div>
    </div>
    <div className="section"><Link className="btn" href="/profile">Back to profile</Link></div>
  </div></div>;
}
