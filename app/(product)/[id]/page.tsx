import Link from "next/link";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { productToView } from "@/lib/marketplace";
import { TierBadge, VerifiedLine } from "@/components/badges";
import { BookmarkIcon, Icons } from "@/components/icons";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const {id}=await params; const row=await prisma.product.findUnique({where:{id},include:{seller:{include:{user:true}}}}); if(!row||row.status==="DELETED"||row.status==="SUSPENDED") notFound(); const product=productToView(row);
  return <SiteShell><div className="page"><Link href="/marketplace" className="btn btn--ghost"><Icons.ArrowLeft size={16}/> Marketplace</Link><div className="grid-2" style={{marginTop:18}}><div className="card" style={{padding:8}}><img src={product.image} alt="" style={{width:'100%',borderRadius:20,display:'block'}}/></div><div className="card"><div className="eyebrow">{product.category}</div><h1 style={{fontSize:'clamp(40px,5vw,64px)',marginTop:10}}>{product.title}</h1><div className="product-seller" style={{marginTop:18}}><span className="seller-name">{product.seller}</span><TierBadge tier={product.badge}/>{product.verified?<VerifiedLine/>:null}</div><div className="product-meta" style={{marginTop:18}}>{product.rating!=null&&<span>★ {product.rating.toFixed(1)} seller rating</span>}{product.level&&<span>Level {product.level} · {product.region??'—'}</span>}</div><p>Payment is hosted by Veritas. Order and price are created from the server-side listing record.</p><div className="product-price"><strong>{product.price.toFixed(2)}</strong><span>ETB</span></div><div style={{display:'flex',gap:9,marginTop:20}}><button className="icon-button glass-button"><BookmarkIcon/></button><Link href={`/purchase?product=${encodeURIComponent(product.id)}`} className="btn btn--primary" style={{flex:1}}>Buy now</Link></div></div></div></div></SiteShell>;
}
