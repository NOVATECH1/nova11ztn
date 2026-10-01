import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { UserBadges } from '@/app/components/badge';

export default async function Marketplace() {
  let listings: any[] = [];
  try {
    listings = await db.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { select: { username: true, displayName: true, isVerified: true, isOfficial: true } } },
      orderBy: [{ pinned: 'desc' }, { trendingScore: 'desc' }, { createdAt: 'desc' }],
      take: 24
    });
  } catch {}

  return (
    <div className="page">
      <div className="container">
        <section className="hero compact-hero">
          <div className="eyebrow">Marketplace</div>
          <h1>Find something useful.</h1>
          <p>Browse real seller listings, open their storefronts and save products you want to revisit.</p>
          <div className="actions">
            <Link className="btn btn-primary" href="/search?tab=marketplace">Search marketplace</Link>
            <Link className="btn" href="/profile">Seller center</Link>
          </div>
        </section>

        {listings.length ? (
          <div className="grid-3">
            {listings.map((x: any) => (
              <article className="card product-card card-lift" key={x.id}>
                <div className="product-image">
                  <Image src="/media/market-service.svg" alt="" width={105} height={105}/>
                </div>
                <div className="product-body">
                  <UserBadges isVerified={x.seller?.isVerified} isOfficial={x.seller?.isOfficial} interactive />
                  <h3>{x.title}</h3>
                  <p>{x.description}</p>
                  <p className="muted">{x.category} · @{x.seller?.username}</p>
                  <div className="price">{x.price.toLocaleString('en-ET')} ETB</div>
                  <div className="actions">
                    <Link className="btn btn-small" href={`/u/${x.seller?.username}`}>Seller profile</Link>
                    <Link className="btn btn-primary btn-small" href={`/u/${x.seller?.username}/store`}>View listing</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <div className="eyebrow">Marketplace</div>
            <h2>No active listings yet</h2>
            <p>When sellers publish products, they will appear here. This page never invents marketplace products just to fill the interface.</p>
            <div className="actions" style={{justifyContent:'center'}}>
              <Link className="btn btn-primary" href="/profile">Become a seller</Link>
              <Link className="btn" href="/store">Open Official Store</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
