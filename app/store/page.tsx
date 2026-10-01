import { SmartImage } from '@/app/components/smart-image';
import Link from 'next/link';
import { getStoreCatalog } from '@/lib/store';

export default async function StorePage() {
  const categories = await getStoreCatalog();
  return (
    <div className="page">
      <div className="container">
        <section className="hero compact-hero">
          <div className="eyebrow">ZTN Official</div>
          <h1>Official Store.</h1>
          <p>Direct ZTN services, separate from independent marketplace sellers. Choose a category to continue.</p>
        </section>

        <div className="grid-2">
          {categories.map((cat: any) => (
            <Link key={cat.slug} href={`/store/${cat.slug}`} className="card category-card card-lift">
              <div className="category-image">
                <SmartImage src={cat.imageUrl || '/media/instagram.svg'} alt={cat.name} width={70} height={70}/>
              </div>
              <div>
                <div className="eyebrow">Official</div>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <section className="section">
          <div className="feature-panel">
            <span className="feature-kicker">Clear fulfillment</span>
            <h2>Automatic where supported. Manual where required.</h2>
            <p>
              Free Fire services can use automatic delivery integrations. Instagram services remain
              manually fulfilled after the target is verified and payment is confirmed.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
