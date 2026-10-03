# ZTN Store & Marketplace — Fresh Build

This is a **new ZTN project built from zero**. It does not reuse the old ZTN application, routes, auth, schema, or components.

## Included

- Next.js 16 App Router + TypeScript
- Clerk authentication
- Neon PostgreSQL + Prisma
- Veritas hosted payment links + signed webhook processing
- Didit KYC sessions + signed webhook processing
- Waliya server-side catalog + Free Fire delivery
- Brevo transactional-email adapter
- Cloudflare R2 presigned uploads
- Marketplace, seller profiles, guest checkout, Official Store, Free Fire, Instagram, Premium/Premium+, orders and admin operations
- Exact requested Lucide icon family and the user-supplied badge SVG geometry
- Light/dark theme
- Cloudflare Cron Trigger (hourly order auto-complete)

## Business rules wired

- Marketplace commission: **5%**
- Seller payout hold: **24 hours after verified payment / completion window**
- Minimum payout: **100 ETB** per payable payout record
- Free Fire pricing: live Waliya provider price converted to ETB + **5 ETB ZTN markup**
- Instagram Followers: **0.89 ETB/follower**, 1% discount per 100 followers, capped at 50%, maximum 5,000
- Instagram Likes: **0.44 ETB/like**, quantity in steps of 100
- Premium/Premium+ prices are the locked 10-plan values in `lib/data.ts`
- KYC required for selling and Premium/Premium+ purchase
- Free Fire flow: UID → confirmation popup → payment → Waliya; **no separate UID validation API**

## Security model

- Waliya PublicKey/SecretKey and bearer tokens stay server-side.
- Veritas API key stays server-side.
- Payment amount is always loaded from Neon; the browser cannot choose the price.
- Veritas webhooks are HMAC-verified with `X-Veritas-Signature`.
- Didit webhooks are HMAC-verified with `X-Signature-V2`.
- Admin pages fail closed unless Clerk + Neon are configured and the database role is `ADMIN`.
- R2 upload URLs are scoped to the authenticated user, server-generated, time-limited, type-limited and content-length limited.
- Marketplace account credentials are encrypted before storage.
- Guest checkout uses a per-order secret checkout token.

## Environment

Copy `.env.example` to `.env.local` and add your own private credentials. Never commit secrets.

## Database

```bash
npm install
npm run db:generate
npm run db:migrate
```

Use a Neon pooled connection for runtime `DATABASE_URL` and the direct connection for `DIRECT_URL` migrations.

## Validate locally

```bash
npm run smoke
npm run typecheck
npm run build
npm run dev
```

A real provider test is still required after credentials are configured. This environment did not have registry access, so no false claim is made that a production Next.js build ran here.

## Deployment (Cloudflare Workers)

The project runs on Cloudflare Workers with the OpenNext adapter. It does NOT use Vercel.

Files added for Cloudflare: `wrangler.jsonc`, `open-next.config.ts`, `cloudflare-worker.mjs`. The database client in `lib/prisma.ts` uses the Neon adapter.

1. `npm install`
2. Make a `.dev.vars` file (same names as `.env.example`) for local preview. Never commit it.
3. `npm run preview` tests it locally on the Workers runtime.
4. Add every secret in Cloudflare: Workers & Pages -> your Worker -> Settings -> Variables and Secrets (or `npx wrangler secret put NAME`).
5. `NEXT_PUBLIC_*` values are read at BUILD time. Set them in the build environment before `npm run deploy`.
6. `npm run deploy`

The hourly timer is a Cloudflare Cron Trigger (`triggers.crons` in `wrangler.jsonc`). It calls `/api/cron/auto-complete` with `CRON_SECRET`, so `CRON_SECRET` must be set as a secret.

## Public docs used

- Clerk: https://clerk.com/docs/nextjs/getting-started/quickstart
- Prisma + Neon: https://www.prisma.io/docs/orm/v6/overview/databases/neon
- Veritas: https://veritas.et/docs
- Waliya: https://waliyatopup.com/developer
- Didit: https://didit.me/developers/
- Brevo: https://developers.brevo.com/docs/send-a-transactional-email
- Cloudflare R2: https://developers.cloudflare.com/r2/api/s3/api/
- Cloudflare Workers + Next.js: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare
