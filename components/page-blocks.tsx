"use client";

import Link from "next/link";
import { categories, officialStore, premiumPlans } from "@/lib/data";
import { iconMap, Icons } from "./icons";
import { TierBadge, VerifiedLine } from "./badges";
import { formatETB } from "@/lib/utils";

export function CategoryGrid() {
  return <div className="category-grid">{categories.map(item => { const Icon = iconMap[item.icon as keyof typeof iconMap]; return <Link key={item.name} href={`/marketplace?category=${encodeURIComponent(item.name)}`} className="category-card"><span className="category-icon"><Icon size={25}/></span><span><strong>{item.name}</strong><span className="muted" style={{display:"block",fontSize:12,marginTop:5}}>Explore products</span></span></Link>; })}</div>;
}

export function SellerGrid({ sellers = [] }: { sellers?: Array<{ id: string; name: string; badge?: "Premium" | "Premium+" | "Official" | "Top Seller"; rating: number; verified: boolean; listings: number }> }) {
  if (!sellers.length) return <div className="card empty-state"><h3>No seller profiles yet.</h3><p>Verified sellers will appear here after they publish listings.</p></div>;
  return <div className="grid-4">{sellers.map(s => <Link href={`/seller?seller=${encodeURIComponent(s.id)}`} className="card" key={s.id}><div className="profile-head" style={{gridTemplateColumns:"auto 1fr"}}><div className="profile-avatar" style={{width:64,height:64,borderRadius:20,fontSize:20}}>{s.name.slice(0,2).toUpperCase()}</div><div><div className="profile-name"><strong>{s.name}</strong><TierBadge tier={s.badge}/></div>{s.verified ? <VerifiedLine/> : null}<div className="muted" style={{fontSize:12,marginTop:6}}>★ {s.rating.toFixed(1)} · {s.listings} active listings</div></div></div><p style={{fontSize:13}}>View seller profile and active marketplace listings.</p></Link>)}</div>;
}

export function StoreOverview() {
  return <div className="store-sections">{[...officialStore.games, ...officialStore.social].map(item => <Link href={item.href} key={item.name} className="store-card"><div><div className="eyebrow">{item.name.includes("Instagram") ? "Social" : "Games"}</div><h3>{item.name}</h3><p style={{margin:"4px 0 0",fontSize:13}}>{item.subtitle}</p></div><div style={{textAlign:"right"}}><span className="status available">Available</span><div style={{marginTop:8}}><Icons.ChevronRight size={20}/></div></div></Link>)}</div>;
}

export function PremiumPlanGrid({ limit }: { limit?: number }) {
  const plans = limit ? premiumPlans.slice(0, limit) : premiumPlans;
  return <div className="plan-grid">{plans.map((plan, index) => <div className={`plan-card ${plan.tier === "Premium+" ? "plus" : ""}`} key={`${plan.tier}-${plan.duration}`}>{plan.popular && <span className="popular">Popular</span>}<div className="eyebrow">{plan.tier}</div><h3>{plan.duration}</h3><strong>{formatETB(plan.price)} <small style={{fontSize:11,fontFamily:"Space Grotesk",color:"var(--muted)"}}>ETB</small></strong><span className="muted" style={{fontSize:12,marginTop:7}}>KYC required</span><Link href={`${plan.tier === "Premium+" ? "/premium-plus" : "/premium"}?plan=${index+1}`} className="btn btn--soft" style={{marginTop:14}}>Choose</Link></div>)}</div>;
}

export function Benefits({ plus = false }: { plus?: boolean }) {
  const common = ["Premium profile badge", "Styling", "Priority listing placement", "Featured seller eligibility", "Custom bio + links", "Extra profile customization", "Priority support", "Early feature access", "Premium seller tools"];
  const extra = ["Premium+ badge", "500MB uploads", "Higher listing priority", "Featured seller priority", "Advanced seller insights & tools", "More customization", "Exclusive profile elements"];
  return <div className="benefit-list">{(plus ? [...common, ...extra] : [...common, "100MB uploads"]).map(item => <div className="benefit" key={item}><Icons.CheckCircle2 size={16} style={{color:"var(--blue)",verticalAlign:"-3px",marginRight:7}}/>{item}</div>)}</div>;
}
