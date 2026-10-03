"use client";

import Link from "next/link";
import { useState } from "react";
import { BookmarkIcon } from "./icons";
import { TierBadge, VerifiedLine } from "./badges";
import { formatETB } from "@/lib/utils";
import type { ProductView } from "@/lib/marketplace";

export function ProductCard({ product }: { product: ProductView }) {
  const [saved, setSaved] = useState(false);
  return <article className="product-card">
    <div className="product-media"><img src={product.image} alt="" /><button className={`icon-button product-save glass-button ${saved ? "is-saved" : ""}`} onClick={() => setSaved(v => !v)} aria-label="Save"><BookmarkIcon saved={saved}/></button></div>
    <div className="product-body">
      <div className="product-meta"><span>{product.category}</span>{product.rating != null ? <span>★ {product.rating.toFixed(1)}</span> : null}</div>
      <h3><Link href={`/product/${product.id}`}>{product.title}</Link></h3>
      {product.level ? <div className="product-meta"><span>Level {product.level}</span><span>{product.region ?? "—"}</span></div> : <div className="product-meta"><span>Digital product</span><span>Active</span></div>}
      <div className="product-seller"><span className="seller-name">{product.seller}</span><TierBadge tier={product.badge}/>{product.verified ? <VerifiedLine/> : null}</div>
      <div className="product-price"><strong>{formatETB(product.price)}</strong><span>ETB</span></div>
      <div className="product-buy"><Link href={`/purchase?product=${encodeURIComponent(product.id)}`} className="btn btn--primary">Buy <span>→</span></Link></div>
    </div>
  </article>;
}

export function ProductRail({ title = "Popular & New", items = [] }: { title?: string; items?: ProductView[] }) {
  return <section className="section"><div className="section-head"><div><div className="eyebrow">Fresh picks</div><h2>{title}</h2></div><Link href="/marketplace" className="btn btn--ghost">View all</Link></div>{items.length ? <div className="product-grid">{items.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="card empty-state"><h3>No listings yet.</h3><p>Live marketplace products will appear here when sellers publish verified listings.</p></div>}</section>;
}
