import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const categories=[
 {slug:'instagram',name:'Instagram',description:'Followers and Likes',imageUrl:'/media/instagram.svg',sortOrder:1},
 {slug:'free-fire',name:'Free Fire',description:'Top Up, Level Up and Membership',imageUrl:'/media/free-fire.svg',sortOrder:2},
];
const products=[
 {category:'instagram',slug:'followers',name:'Instagram Followers',type:'INSTAGRAM_FOLLOWERS',fieldLabel:'Instagram username',imageUrl:'/media/instagram-followers.svg',description:'Followers package',sortOrder:1,packages:[['100 Followers',50],['500 Followers',200],['1,000 Followers',350]]},
 {category:'instagram',slug:'likes',name:'Instagram Likes',type:'INSTAGRAM_LIKES',fieldLabel:'Instagram post link',imageUrl:'/media/instagram-likes.svg',description:'Likes package',sortOrder:2,packages:[['100 Likes',30],['500 Likes',100],['1,000 Likes',180]]},
 {category:'free-fire',slug:'top-up',name:'Free Fire Top Up',type:'FREE_FIRE_TOPUP',fieldLabel:'Free Fire Player UID',imageUrl:'/media/free-fire-topup.svg',description:'Diamond package',sortOrder:1,packages:[['100 Diamonds',220],['210 Diamonds',440],['530 Diamonds',1050]]},
 {category:'free-fire',slug:'level-up',name:'Free Fire Level Up',type:'FREE_FIRE_LEVELUP',fieldLabel:'Free Fire Player UID',imageUrl:'/media/free-fire-levelup.svg',description:'Level Up package',sortOrder:2,packages:['Level 6','Level 10','Level 15','Level 20','Level 25','Level 30','All Levels'].map((x)=>[x,0])},
 {category:'free-fire',slug:'membership',name:'Free Fire Membership',type:'FREE_FIRE_MEMBERSHIP',fieldLabel:'Free Fire Player UID',imageUrl:'/media/free-fire-membership.svg',description:'Membership package',sortOrder:3,packages:[['Weekly Membership',100],['Monthly Membership',300]]},
];
const plans=[
 ['PREMIUM',7,99],['PREMIUM',30,299],['PREMIUM',90,799],['PREMIUM',180,1399],['PREMIUM',365,2499],
 ['PREMIUM_PLUS',7,299],['PREMIUM_PLUS',30,499],['PREMIUM_PLUS',90,999],['PREMIUM_PLUS',180,1599],['PREMIUM_PLUS',365,2699]
];
async function main(){
 for(const c of categories) await db.storeCategory.upsert({where:{slug:c.slug},update:c,create:c});
 for(const p of products){const c=await db.storeCategory.findUniqueOrThrow({where:{slug:p.category}}); const product=await db.storeProduct.upsert({where:{slug:p.slug},update:{name:p.name,type:p.type as any,fieldLabel:p.fieldLabel,imageUrl:p.imageUrl,description:p.description,sortOrder:p.sortOrder,active:true},create:{categoryId:c.id,slug:p.slug,name:p.name,type:p.type as any,fieldLabel:p.fieldLabel,imageUrl:p.imageUrl,description:p.description,sortOrder:p.sortOrder}}); for(let i=0;i<p.packages.length;i++){const [name,price]=p.packages[i]; const existing=await db.storePackage.findFirst({where:{productId:product.id,name}}); if(existing) await db.storePackage.update({where:{id:existing.id},data:{price:Number(price),active:true,sortOrder:i}}); else await db.storePackage.create({data:{productId:product.id,name,price:Number(price),active:true,sortOrder:i,detail:'Admin configurable package'}})}}
 for(const [tier,durationDays,price] of plans) await db.subscriptionPlan.upsert({where:{tier_durationDays:{tier:tier as any,durationDays:Number(durationDays)}},update:{price:Number(price),label:durationDays===7?'7 days':durationDays===30?'1 month':durationDays===90?'3 months':durationDays===180?'6 months':'12 months',active:true},create:{tier:tier as any,durationDays:Number(durationDays),price:Number(price),label:durationDays===7?'7 days':durationDays===30?'1 month':durationDays===90?'3 months':durationDays===180?'6 months':'12 months'}});
 const adminEmail=process.env.ADMIN_EMAIL; if(adminEmail){const u=await db.user.upsert({where:{email:adminEmail},update:{role:'ADMIN',admin2faEnabled:true,isOfficial:true},create:{email:adminEmail,displayName:'ZTN Official',username:'ZTNOfficial',role:'ADMIN',admin2faEnabled:true,isOfficial:true,isVerified:true}}); console.log(`Admin seeded: ${u.email}`)}
}
main().finally(()=>db.$disconnect());
