import Image from 'next/image';
import Link from 'next/link';
import { catalog } from '@/lib/catalog';

export default function HomePage() {
  return (
    <div className="page">
      <div className="container">
        <section className="hero">
          <div className="eyebrow">ZTN Store & Marketplace</div>
          <h1>Buy, sell and discover digital services.</h1>
          <p>
            A focused marketplace for digital products and services, with the official ZTN Store for
            Free Fire and Instagram services.
          </p>
          <form action="/search" className="hero-search">
            <input name="q" placeholder="Search products, sellers or services" aria-label="Search ZTN" />
            <button className="btn btn-primary">Search ZTN</button>
          </form>
          <div className="actions">
            <Link className="btn btn-primary" href="/store">Explore Official Store</Link>
            <Link className="btn" href="/marketplace">Browse Marketplace</Link>
          </div>
        </section>

        <section className="feature-panel">
          <span className="feature-kicker">ZTN Official Store</span>
          <h2>Official services, clearly separated from the marketplace.</h2>
          <p>
            Free Fire services are built for automatic delivery where supported. Instagram services
            stay manual, with the target checked before payment.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/store">Open Official Store</Link>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div><div className="eyebrow">Official Store</div><h2>Start with a service</h2></div>
            <Link className="muted" href="/store">View all →</Link>
          </div>
          <div className="grid-2">
            <Link className="card category-card card-lift" href="/store/instagram">
              <div className="category-image"><Image src={catalog.instagram.image} alt="Instagram" width={70} height={70}/></div>
              <div><h3>Instagram</h3><p>Followers and likes with target verification and manual fulfillment.</p></div>
            </Link>
            <Link className="card category-card card-lift" href="/store/free-fire">
              <div className="category-image"><Image src={catalog.freeFire.image} alt="Free Fire" width={70} height={70}/></div>
              <div><h3>Free Fire</h3><p>Top Up, Membership and supported automatic delivery services.</p></div>
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div><div className="eyebrow">Marketplace</div><h2>Buy from independent sellers</h2></div>
            <Link className="muted" href="/marketplace">Browse →</Link>
          </div>
          <div className="grid-3">
            <div className="card card-pad card-lift"><div className="eyebrow">01</div><h3>Discover</h3><p className="muted">Find digital products and services from ZTN sellers.</p></div>
            <div className="card card-pad card-lift"><div className="eyebrow">02</div><h3>Buy securely</h3><p className="muted">Use protected checkout and track your order from payment to completion.</p></div>
            <div className="card card-pad card-lift"><div className="eyebrow">03</div><h3>Sell on ZTN</h3><p className="muted">Complete KYC, publish listings and fulfill orders manually.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
