import Link from "next/link";
export const dynamic = "force-dynamic";
import { SiteShell } from "@/components/shell";
import { Brand } from "@/components/brand";
import { CategoryGrid, SellerGrid, StoreOverview } from "@/components/page-blocks";
import { ProductRail } from "@/components/product-card";
import { listProducts } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";

export default async function HomePage() {
  const [products, sellers] = await Promise.all([
    listProducts({ limit: 4 }).catch(() => []),
    prisma.sellerProfile.findMany({ where: { verified: true }, include: { user: true }, orderBy: { rating: "desc" }, take: 4 }).catch(() => []),
  ]);
  const sellerViews = sellers.map(s => ({ id: s.id, name: s.user.name || s.user.email || "Seller", badge: s.badge === "NONE" ? undefined : s.badge === "PREMIUM_PLUS" ? "Premium+" as const : s.badge === "PREMIUM" ? "Premium" as const : s.badge === "OFFICIAL" ? "Official" as const : "Top Seller" as const, rating: Number(s.rating), verified: s.verified, listings: s.totalListings }));
  return <SiteShell><div className="page page--wide">
    <section className="hero"><div className="hero__content"><div className="hero__chips"><span className="chip">Built to Prevent Scams</span><span className="chip">Built for Ethiopia's gaming community</span></div><h1>Buy & Sell <span>Digital Products.</span></h1><p>A focused marketplace for gaming accounts, top-ups, design assets and Free Fire sensitivity — with safer payments and clear seller identity.</p><div className="hero__actions"><Link href="/marketplace" className="btn btn--primary">Explore Marketplace <ArrowUpRight size={17}/></Link><Link href="/sell" className="btn btn--ghost">Start Selling</Link></div><div className="search-bar"><span className="category-icon" style={{width:44,height:44,borderRadius:14}}><Sparkles size={19}/></span><input placeholder="Search accounts, top-ups, sensitivity, design..."/><Link className="btn btn--primary" href="/marketplace">Search</Link></div></div></section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Discover</div><h2>Find your next digital drop.</h2></div><Link href="/marketplace" className="btn btn--ghost">View all</Link></div><CategoryGrid/></section>
    <ProductRail items={products}/>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Official Store</div><h2>Games + Social.</h2></div><Link href="/official-store" className="btn btn--ghost">Open store</Link></div><div className="store-hero"><div className="store-preview"><img src="/assets/free-fire.svg" alt=""/><div className="store-preview__copy"><Brand compact/><h2 style={{marginTop:8}}>Official Store</h2><p>Waliya-powered catalog · active products only</p></div></div><StoreOverview/></div></section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Seller identity</div><h2>People, not mystery accounts.</h2></div><Link href="/seller" className="btn btn--ghost">Browse sellers</Link></div><SellerGrid sellers={sellerViews}/></section>
    <section className="section grid-3"><div className="card"><ShieldCheck size={26} color="var(--blue)"/><h3 style={{marginTop:12}}>Verified payments</h3><p>Orders change state only after server-side payment confirmation.</p></div><div className="card"><Sparkles size={26} color="var(--blue)"/><h3 style={{marginTop:12}}>Focused marketplace</h3><p>No noisy social feed. Just listings, sellers, orders and tools that help a digital shop work.</p></div><div className="card"><ArrowUpRight size={26} color="var(--blue)"/><h3 style={{marginTop:12}}>Guest buying</h3><p>Visitors can browse and start checkout without creating an account.</p></div></section>
  </div></SiteShell>;
}
