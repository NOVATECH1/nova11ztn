import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { UserBadges } from '@/app/components/badge';

export default async function SellerStore({params}:{params:Promise<{username:string}>}){
  const {username}=await params;
  let user:any; let listings:any[]=[]; let tier:any=null;
  try{
    user=await db.user.findUnique({where:{username},select:{id:true,username:true,displayName:true,isVerified:true,isOfficial:true}});
    if(user){
      listings=await db.listing.findMany({where:{seller:{username},status:'ACTIVE'},orderBy:{createdAt:'desc'}});
      const active=await db.subscription.findFirst({where:{userId:user.id,startsAt:{lte:new Date()},endsAt:{gt:new Date()}},include:{plan:true},orderBy:{endsAt:'desc'}});
      tier=active?.plan?.tier??null;
    }
  }catch{}
  if(!user) notFound();
  return <div className="page"><div className="container"><div className="hero"><div className="eyebrow">Seller storefront</div><div className="profile-name-row"><h1>{user.displayName}</h1><UserBadges isVerified={user.isVerified} isOfficial={user.isOfficial} subscriptionTier={tier} interactive/></div><p className="muted">@{user.username}</p></div><div className="grid-3">{listings.map(l=><div className="card card-pad" key={l.id}><h3>{l.title}</h3><p className="muted">{l.description}</p><div className="price">{l.price} ETB</div></div>)}</div></div></div>
}
