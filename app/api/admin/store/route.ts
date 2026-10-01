import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, sameOrigin } from '@/lib/security';

export async function GET(){ try{ await requireAdmin(); const categories=await db.storeCategory.findMany({include:{products:{include:{packages:true}},},orderBy:{sortOrder:'asc'}}); return NextResponse.json({categories}); }catch(e:any){return NextResponse.json({error:e?.message==='FORBIDDEN'?'Forbidden':'Not authenticated'},{status:e?.message==='FORBIDDEN'?403:401});} }

export async function POST(req:Request){
 if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{ const admin=await requireAdmin(); const body=await req.json(); const kind=body.kind;
  if(kind==='category'){ const c=await db.storeCategory.create({data:{slug:body.slug,name:body.name,description:body.description||null,imageUrl:body.imageUrl||null,sortOrder:Number(body.sortOrder||0),active:body.active!==false}}); await db.auditLog.create({data:{actorUserId:admin.id,action:'STORE_CATEGORY_CREATED',targetType:'StoreCategory',targetId:c.id,metadata:{name:c.name}}}); return NextResponse.json(c); }
  if(kind==='product'){ const p=await db.storeProduct.create({data:{categoryId:body.categoryId,slug:body.slug,name:body.name,description:body.description||null,imageUrl:body.imageUrl||null,type:body.type,fieldLabel:body.fieldLabel||null,sortOrder:Number(body.sortOrder||0),active:body.active!==false}}); await db.auditLog.create({data:{actorUserId:admin.id,action:'STORE_PRODUCT_CREATED',targetType:'StoreProduct',targetId:p.id,metadata:{name:p.name}}}); return NextResponse.json(p); }
  if(kind==='package'){ const p=await db.storePackage.create({data:{productId:body.productId,name:body.name,detail:body.detail||null,reward:body.reward||null,imageUrl:body.imageUrl||null,price:Number(body.price||0),sortOrder:Number(body.sortOrder||0),active:body.active!==false,waliyaTopUpId:body.waliyaTopUpId||null,waliyaServiceId:body.waliyaServiceId||null}}); await db.auditLog.create({data:{actorUserId:admin.id,action:'STORE_PACKAGE_CREATED',targetType:'StorePackage',targetId:p.id,metadata:{name:p.name}}}); return NextResponse.json(p); }
  return NextResponse.json({error:'Unknown admin store action'},{status:400});
 }catch(e:any){return NextResponse.json({error:e?.message||'Admin action failed'},{status:e?.message==='FORBIDDEN'?403:400});}
}


export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    if (body.kind === 'category') {
      const item = await db.storeCategory.update({ where: { id: body.id }, data: { name: body.name, slug: body.slug, description: body.description ?? null, imageUrl: body.imageUrl ?? null, sortOrder: Number(body.sortOrder || 0), active: body.active !== false } });
      await db.auditLog.create({ data: { actorUserId: admin.id, action: 'STORE_CATEGORY_UPDATED', targetType: 'StoreCategory', targetId: item.id } });
      return NextResponse.json(item);
    }
    if (body.kind === 'product') {
      const item = await db.storeProduct.update({ where: { id: body.id }, data: { categoryId: body.categoryId, name: body.name, slug: body.slug, description: body.description ?? null, imageUrl: body.imageUrl ?? null, fieldLabel: body.fieldLabel ?? null, active: body.active !== false, sortOrder: Number(body.sortOrder || 0), type: body.type } });
      await db.auditLog.create({ data: { actorUserId: admin.id, action: 'STORE_PRODUCT_UPDATED', targetType: 'StoreProduct', targetId: item.id } });
      return NextResponse.json(item);
    }
    if (body.kind === 'package') {
      const item = await db.storePackage.update({ where: { id: body.id }, data: { name: body.name, detail: body.detail ?? null, reward: body.reward ?? null, imageUrl: body.imageUrl ?? null, price: Number(body.price || 0), active: body.active !== false, sortOrder: Number(body.sortOrder || 0), waliyaTopUpId: body.waliyaTopUpId ?? null, waliyaServiceId: body.waliyaServiceId ?? null } });
      await db.auditLog.create({ data: { actorUserId: admin.id, action: 'STORE_PACKAGE_UPDATED', targetType: 'StorePackage', targetId: item.id } });
      return NextResponse.json(item);
    }
    return NextResponse.json({ error: 'Unknown admin store action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Admin action failed' }, { status: e?.message === 'FORBIDDEN' ? 403 : 400 });
  }
}

export async function DELETE(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    if (body.kind === 'category') await db.storeCategory.delete({ where: { id: body.id } });
    else if (body.kind === 'product') await db.storeProduct.delete({ where: { id: body.id } });
    else if (body.kind === 'package') await db.storePackage.delete({ where: { id: body.id } });
    else return NextResponse.json({ error: 'Unknown admin store action' }, { status: 400 });
    await db.auditLog.create({ data: { actorUserId: admin.id, action: `STORE_${String(body.kind).toUpperCase()}_DELETED`, targetType: String(body.kind), targetId: String(body.id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Admin delete failed' }, { status: e?.message === 'FORBIDDEN' ? 403 : 400 });
  }
}
