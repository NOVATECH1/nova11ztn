import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, sameOrigin } from '@/lib/security';
import { sendStoreOrderCreated } from '@/lib/email';
import { quoteInstagramPrice, isValidInstagramUsername, isValidInstagramPostUrl } from '@/lib/instagram-pricing';

export async function POST(req:Request){
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Please log in first.'},{status:401}); if(!(await rateLimit(`sorder:${user.id}`,10,600))) return tooMany();
 const body=await req.json(); if(!body.productId||!body.fulfillmentData) return NextResponse.json({error:'Missing order information.'},{status:400});

 const product=await db.storeProduct.findUnique({where:{id:body.productId}}).catch(()=>null) || await db.storeProduct.findFirst({where:{slug:body.productSlug,active:true}}).catch(()=>null);
 if(!product) return NextResponse.json({error:'This product is unavailable.'},{status:409});

 // Instagram followers/likes: price is computed server-side from quantity,
 // there is no fixed package row — the server NEVER trusts a client price.
 if (product.type === 'INSTAGRAM_FOLLOWERS' || product.type === 'INSTAGRAM_LIKES') {
   const isFollowers = product.type === 'INSTAGRAM_FOLLOWERS';
   const qty = Number(body.qty);
   const target = String(body.fulfillmentData?.target || '').trim();
   const quote = quoteInstagramPrice(isFollowers ? 'followers' : 'likes', qty);
   if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });
   const targetOk = isFollowers ? isValidInstagramUsername(target) : (isValidInstagramUsername(target) || isValidInstagramPostUrl(target));
   if (!targetOk) return NextResponse.json({ error: 'Enter a valid Instagram username or post link.' }, { status: 400 });

   const orderNumber=`ZTN-${Date.now().toString().slice(-8)}`;
   const priceKobo = Math.round(quote.priceBirr); // whole birr, matches other price fields (Int)
   const order=await db.storeOrder.create({data:{orderNumber,userId:user.id,productId:product.id,packageName:`${qty} ${isFollowers?'followers':'likes'}`,price:priceKobo,status:'PENDING_PAYMENT',deliveryProvider:'MANUAL',fulfillmentData:{target,qty,discountPct:quote.discountPct}}});
   await sendStoreOrderCreated({orderNumber: order.orderNumber, product: product.name, packageName: order.packageName || '', price: order.price, referenceNumber: null, fulfillmentData: (order.fulfillmentData as Record<string, unknown> | null)}).catch(()=>{});
   return NextResponse.json({ok:true,id:order.id,orderNumber:order.orderNumber});
 }

 if(!body.packageId) return NextResponse.json({error:'Missing order information.'},{status:400});
 const productWithPkgs=await db.storeProduct.findUnique({where:{id:product.id},include:{packages:true}});
 const pkg=productWithPkgs?.packages.find((x:any)=>x.active && (x.id===body.packageId || x.name===body.packageName)); if(!pkg) return NextResponse.json({error:'This package is unavailable.'},{status:409});
 if (!Number.isFinite(pkg.price) || pkg.price <= 0) return NextResponse.json({error:'This package is not currently available for purchase.'},{status:409});
 const orderNumber=`ZTN-${Date.now().toString().slice(-8)}`; const order=await db.storeOrder.create({data:{orderNumber,userId:user.id,productId:product.id,packageId:pkg.id,packageName:pkg.name,price:pkg.price,status:'PENDING_PAYMENT',paymentMethod:'VERITAS',fulfillmentData:body.fulfillmentData,deliveryProvider:'MANUAL'}});
 await sendStoreOrderCreated({orderNumber: order.orderNumber, product: product.name, packageName: pkg.name, price: pkg.price, referenceNumber: order.referenceNumber, fulfillmentData: (order.fulfillmentData as Record<string, unknown> | null)}).catch(()=>{});
 return NextResponse.json({ok:true,id:order.id,orderNumber:order.orderNumber});
}
