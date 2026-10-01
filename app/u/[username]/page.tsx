import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { UserBadges } from '@/app/components/badge';
import { ProfileShare } from '@/app/components/profile-share';

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    include: { _count: { select: { listings: true } } }
  }).catch(() => null);
  if (!user) notFound();

  const [active, reviews] = await Promise.all([
    db.subscription.findFirst({
      where: { userId: user.id, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
      include: { plan: true },
      orderBy: { endsAt: 'desc' }
    }).catch(() => null),
    db.review.aggregate({
      where: { sellerId: user.id },
      _avg: { stars: true },
      _count: { _all: true }
    }).catch(() => ({ _avg: { stars: null }, _count: { _all: 0 } }))
  ]);

  return (
    <div className="page">
      <div className="container">
        <Link className="back" href="/search">← Search</Link>

        <div className="card profile-header">
          <div className="profile-avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="profile-identity">
            <div className="eyebrow">Public seller profile</div>
            <div className="profile-name-row">
              <h1>{user.displayName}</h1>
              <UserBadges
                isVerified={user.isVerified}
                isOfficial={user.isOfficial}
                subscriptionTier={active?.plan.tier as 'PREMIUM'|'PREMIUM_PLUS'|undefined}
                interactive
              />
            </div>
            <p className="muted">@{user.username}</p>
            <div className="profile-stats">
              <span>{reviews._count._all} reviews</span>
              <span>{reviews._avg.stars ? `${reviews._avg.stars.toFixed(1)} ★ rating` : 'No reviews yet'}</span>
              <span>{user._count.listings} active listings</span>
              <span>Joined {user.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="actions">
              <ProfileShare username={user.username} />
              <Link className="btn btn-primary" href={`/u/${user.username}/store`}>View storefront</Link>
            </div>
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <div><div className="eyebrow">Seller storefront</div><h2>Available listings</h2></div>
          </div>
          <div className="feature-panel">
            <h2>Shop this seller's marketplace listings.</h2>
            <p>Public profile information stays limited to seller-facing details. KYC, balance and payout information are never exposed.</p>
            <Link className="btn btn-primary" href={`/u/${user.username}/store`}>Open storefront</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
