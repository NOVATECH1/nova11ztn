import { SiteShell } from "@/components/shell";
export const dynamic = "force-dynamic";
import { ProductCard } from "@/components/product-card";
import { categories } from "@/lib/data";
import { listProducts } from "@/lib/marketplace";
import { SlidersHorizontal } from "lucide-react";

export default async function MarketplacePage({ searchParams }: { searchParams?: Promise<{ category?: string; q?: string }> }) {
  const params=(await searchParams)??{}; const active=params.category??"All"; const search=params.q??""; const filtered=await listProducts({category:active,search,limit:40}).catch(()=>[]);
  return <SiteShell><div className="page page--wide"><div className="eyebrow">Marketplace</div><h1 style={{marginTop:12}}>Browse <span style={{color:"var(--blue)"}}>with intent.</span></h1><p>Live listings only. Product counts, sellers and prices come from Neon.</p><form className="search-bar" action="/marketplace"><SlidersHorizontal size={18}/><input name="q" defaultValue={search} placeholder="Search listings..."/><button className="btn btn--primary">Search</button></form><div className="filter-row">{["All",...categories.map(c=>c.name)].map(item=><a className={`filter ${active===item?"active":""}`} key={item} href={item==="All"?"/marketplace":`/marketplace?category=${encodeURIComponent(item)}`}>{item}</a>)}</div><div className="market-grid"><aside className="sidebar-filter card"><div className="filter-group"><h4>Sort</h4><div className="filter-list"><span>Newest</span><span>Popular</span><span>Price low → high</span><span>Price high → low</span></div></div><div className="filter-group"><h4>Seller</h4><div className="filter-list"><span>Premium sellers</span><span>4.5+ rating</span></div></div></aside><div><div className="section-head" style={{marginBottom:14}}><div><div className="eyebrow">{filtered.length} live</div><h2 style={{fontSize:30}}>{active==="All"?"Popular & New":active}</h2></div></div>{filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="card empty-state"><h3>No live listings.</h3><p>New verified listings will appear here automatically.</p></div>}</div></div></div></SiteShell>;
}
