import { SmartImage } from '@/app/components/smart-image';
import Link from 'next/link';
import { getStoreCatalog } from '@/lib/store';
import { notFound } from 'next/navigation';
export default async function CategoryPage({params}:{params:Promise<{category:string}>}){
  const {category}=await params; const categories:any[]=await getStoreCatalog(); const cat=categories.find((x)=>x.slug===category); if(!cat) notFound();
  return <div className="page"><div className="container"><Link className="back" href="/store">← Official Store</Link><div className="hero"><div className="eyebrow">{cat.name}</div><h1>{cat.name} Services</h1><p>{cat.description}</p></div><div className="grid-3">{cat.products.map((p:any)=><Link key={p.id} href={`/store/${category}/${p.slug}`} className="card product-card"><div className="product-image"><SmartImage src={p.imageUrl||p.image||'/media/instagram.svg'} alt={p.name} width={105} height={105}/></div><div className="product-body"><h3>{p.name}</h3><p>{p.description}</p><div className="price">{p.packages?.[0]?.price?`${p.packages[0].price} ETB and up`:'Admin configured'}</div></div></Link>)}</div></div></div>
}
