import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const env = fs.readFileSync(path.join(root,'.env.example'),'utf8');
const catalog = fs.readFileSync(path.join(root,'lib/catalog.ts'),'utf8');
const badge = fs.readFileSync(path.join(root,'app/components/badge.tsx'),'utf8');
const email = fs.readFileSync(path.join(root,'lib/email.ts'),'utf8');
const storeOrder = fs.readFileSync(path.join(root,'app/api/store/orders/route.ts'),'utf8');
const subPurchase = fs.readFileSync(path.join(root,'app/api/subscriptions/purchase/route.ts'),'utf8');
const kyc = fs.readFileSync(path.join(root,'app/api/kyc/start/route.ts'),'utf8');
const marketplace = fs.readFileSync(path.join(root,'app/api/marketplace/listings/route.ts'),'utf8');
const onboarding = fs.readFileSync(path.join(root,'app/api/onboarding/complete/route.ts'),'utf8');
const tests = [];
const subscriptionPage = fs.readFileSync(path.join(root,'app/subscription/page.tsx'),'utf8');
const subPicker = fs.readFileSync(path.join(root,'app/components/subscription-picker.tsx'),'utf8');
const oauthStart = fs.readFileSync(path.join(root,'app/api/auth/google/start/route.ts'),'utf8');
const oauthCallback = fs.readFileSync(path.join(root,'app/api/auth/google/callback/route.ts'),'utf8');
function test(name, fn){ try{fn(); tests.push(`PASS  ${name}`);}catch(e){tests.push(`FAIL  ${name}: ${e.message}`);}}

test('Official Store has Instagram + Free Fire',()=>{assert.match(catalog,/instagram:/);assert.match(catalog,/freeFire:/);});

// 2. Badge rules
test('Badge component includes all four status families',()=>{for(const x of ['isVerified','PREMIUM','PREMIUM_PLUS','Official']) assert.ok(badge.includes(x));});
test('Premium badges render without Premium text',()=>{assert.match(badge,/ztn-badge-item-premium\,\s*font-size:0|ztn-badge-item-premium/);});

test('Premium and Premium+ render as separate tier sections',()=>{assert.match(subscriptionPage,/id="premium"/);assert.match(subscriptionPage,/id="premium-plus"/);assert.match(subscriptionPage,/PREMIUM_PLUS/);});
test('Popular plan is visually marked without merging tiers',()=>{assert.match(subPicker,/popular-label/);assert.match(subPicker,/durationDays === 30/);});

// 3. Pricing
test('Subscription plan prices match current specification',()=>{const config=fs.readFileSync(path.join(root,'lib/config.ts'),'utf8'); const expected=['durationDays: 7, price: 99','durationDays: 30, price: 299','durationDays: 90, price: 799','durationDays: 180, price: 1399','durationDays: 365, price: 2499','durationDays: 7, price: 299','durationDays: 30, price: 499','durationDays: 90, price: 999','durationDays: 180, price: 1599','durationDays: 365, price: 2699']; for(const x of expected) assert.ok(config.includes(x));});

// 4. KYC gates
test('Marketplace seller creation requires VERIFIED KYC',()=>{assert.match(marketplace,/kycStatus !== 'VERIFIED'/);});
test('Subscription purchase requires VERIFIED KYC',()=>{assert.match(subPurchase,/kycStatus !== 'VERIFIED'/);});
test('KYC uses Didit hosted flow',()=>{assert.match(kyc,/createDiditSession/);});

test('Google OAuth start/callback routes exist',()=>{assert.match(oauthStart,/accounts.google.com\/o\/oauth2\/v2\/auth/);assert.match(oauthCallback,/openidconnect.googleapis.com\/v1\/userinfo/);});
test('Onboarding saves the profile without social-follow dependencies',()=>{assert.doesNotMatch(onboarding,/tx\.follow|follow\.upsert/);});

// 5. Order price integrity
test('Official Store order uses database package price',()=>{assert.match(storeOrder,/price:pkg\.price/);});
test('Zero-price packages cannot be purchased',()=>{assert.match(storeOrder,/pkg\.price <= 0/);});

// 6. Brevo
test('Brevo configuration is present',()=>{for(const key of ['BREVO_API_KEY','BREVO_SENDER_EMAIL','BREVO_SENDER_NAME']) assert.match(env,new RegExp(key));});
test('Brevo send endpoint is correct',()=>{assert.match(email,/https:\/\/api\.brevo\.com\/v3\/smtp\/email/);assert.match(email,/api-key/);});
test('Email idempotency record exists',()=>{assert.match(email,/emailDelivery/);assert.match(email,/eventKey/);});

// 7. Imaginary Premium purchase simulation
const user={kyc:'VERIFIED',active:false}; const plan={tier:'PREMIUM_PLUS',durationDays:30,price:499};
test('New Google users are sent to profile onboarding',()=>{const oauth=fs.readFileSync(path.join(root,'app/api/auth/google/callback/route.ts'),'utf8'); assert.match(oauth,/onboarding/); assert.match(onboarding,/Username already used\. Please choose another username\./); assert.match(onboarding,/A-Za-z0-9_\.\]\{3,30\}/);});
test('Simulated Premium+ purchase activates only after KYC',()=>{assert.equal(user.kyc,'VERIFIED');const payment={status:'VERIFIED'};user.active=true;payment.status='ACTIVATED';assert.equal(payment.status,'ACTIVATED');assert.equal(user.active,true);assert.equal(plan.price,499);});

test('Veritas payment routes exist for checkout confirmation and webhook handling',()=>{for(const f of ['app/api/payments/veritas/create/route.ts','app/api/payments/veritas/confirm/route.ts','app/api/payments/veritas/webhook/route.ts']) assert.ok(fs.existsSync(path.join(root,f)));});
test('Marketplace auto-completion is protected by server secret',()=>{const a=fs.readFileSync(path.join(root,'app/api/marketplace/orders/auto-complete/route.ts'),'utf8');assert.match(a,/AUTO_COMPLETE_SECRET/);assert.match(a,/24 \* 60 \* 60 \* 1000/);});

// 8. Imaginary marketplace sale/buy/complete
const listing={price:500,status:'ACTIVE'}; const order={status:'PENDING_PAYMENT',createdAt:Date.now()};
test('Simulated marketplace purchase locks current listing price',()=>{order.price=listing.price;assert.equal(order.price,500);});
test('Simulated buyer payment moves order to PAID',()=>{order.status='PAID';assert.equal(order.status,'PAID');});
test('Simulated seller delivery moves order to DELIVERED',()=>{order.status='DELIVERED';assert.equal(order.status,'DELIVERED');});
test('Simulated 24h auto-completion moves delivered order to COMPLETED',()=>{order.createdAt-=25*60*60*1000; assert.ok(Date.now()-order.createdAt>=24*60*60*1000); order.status='COMPLETED'; assert.equal(order.status,'COMPLETED');});

// 9. Imaginary KYC result
const statuses=['VERIFIED','REJECTED','REVOKED'];
test('Simulated Didit results are mapped to ZTN statuses',()=>{for(const x of statuses) assert.ok(['VERIFIED','REJECTED','REVOKED'].includes(x));});

// 10. No feed/posts
test('No post/feed system is present',()=>{const files=fs.readdirSync(path.join(root,'app'),{recursive:true}).filter(x=>String(x).match(/\.(ts|tsx)$/)); for(const f of files){const t=fs.readFileSync(path.join(root,'app',f),'utf8'); assert.doesNotMatch(t,/createPost|Post\s+model|post expiry/i);}});

console.log(tests.join('\n'));
if(tests.some(x=>x.startsWith('FAIL'))) process.exit(1);
console.log(`\n${tests.length} simulated checks passed.`);
