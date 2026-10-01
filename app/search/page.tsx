import { db } from '@/lib/db';
import Link from 'next/link';
import { catalog } from '@/lib/catalog';

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;tab?:string}>}){
 const q=((await searchParams).q||'').trim().toLowerCase(); const tab=(await searchParams).tab||'all';
 let users:any[]=[]; let listings:any[]=[];
 try{
  if(!q){}
  else { if(tab==='all'||tab==='users') users=await db.user.findMany({where:{OR:[{username:{contains:q}},{displayName:{contains:q}}]},select:{username:true,displayName:true,imageUrl:true},take:20}); if(tab==='all'||tab==='marketplace') listings=await db.listing.findMany({where:{status:'ACTIVE',OR:[{title:{contains:q}},{description:{contains:q}},{category:{contains:q}}]},take:20,orderBy:{createdAt:'desc'}}); }
 }catch{}
 const store= q ? Object.values(catalog).flatMap((c:any)=>c.products).filter((p:any)=>`${p.name} ${p.description}`.toLowerCase().includes(q)) : [];
 return <div className="page"><div className="container"><div className="hero"><div className="eyebrow">Search</div><h1>Find on ZTN</h1><form action="/search" className="actions"><input name="q" defaultValue={q} placeholder="Search users, marketplace, store" style={{flex:1,minWidth:240,padding:12,border:'1px solid var(--line)',borderRadius:10}}/><select name="tab" defaultValue={tab} style={{padding:12,border:'1px solid var(--line)',borderRadius:10}}><option value="all">All</option><option value="users">Users</option><option value="marketplace">Marketplace</option><option value="store">Store</option></select><button className="btn btn-primary">Search</button></form></div><div className="grid-3">{users.map(u=><div className="card card-pad" key={u.username}><strong>@{u.username}</strong><p className="muted">{u.displayName}</p></div>)}{listings.map(l=><div className="card card-pad" key={l.id}><strong>{l.title}</strong><p className="muted">{l.price} ETB · {l.category}</p></div>)}{store.map((p:any)=><Link className="card card-pad" key={p.id} href={`/store/${p.id.startsWith('ig')?'instagram':'free-fire'}/${p.slug}`}><strong>{p.name}</strong><p className="muted">Official Store</p></Link>)}</div></div></div>
}
