import { getStoreCatalog } from '@/lib/store';
import { OrderForm } from '@/app/components/order-form';
import { InstagramOrderForm } from '@/app/components/instagram-order-form';
export default async function StoreOrder({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams; const categories:any[]=await getStoreCatalog(); const cat=categories.find((x:any)=>x.slug===q.category); const p=cat?.products?.find((x:any)=>x.slug===q.product);
  if(!cat||!p) return <div className="page"><div className="container"><div className="card form-card"><h2>Order not found</h2><p className="muted">The selected item may have been removed or deactivated by Admin.</p></div></div></div>;

  if (q.mode === 'instagram') {
    return <div className="page"><div className="container"><InstagramOrderForm category={cat.name} categorySlug={cat.slug} product={p}/></div></div>;
  }

  const pkg=p?.packages?.find((x:any)=>x.id===q.package || x.name===q.packageName);
  if(!pkg) return <div className="page"><div className="container"><div className="card form-card"><h2>Order not found</h2><p className="muted">The selected package may have been removed, deactivated or changed by Admin.</p></div></div></div>;
  return <div className="page"><div className="container"><OrderForm category={cat.name} categorySlug={cat.slug} product={p} pkg={pkg}/></div></div>
}
