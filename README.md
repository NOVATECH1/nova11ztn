# ZTN Store & Marketplace

Production source for **ZTN Store & Marketplace** — BUY • SELL • DISCOVER • GROW.

## Core stack
- Next.js 16 + React 19
- Neon PostgreSQL + Prisma
- Backblaze B2 for storage
- Google OAuth
- Didit hosted identity verification
- Veritas payment verification and webhook hooks
- Brevo transactional email

## Included
- Public landing page and private authenticated app structure
- Official ZTN Store: Instagram and Free Fire
- Free Fire Top Up, Level Up, Membership
- Correct Level Up packages: Level 6, 10, 15, 20, 25, 30, All Levels
- Marketplace listing, buying, delivery, completion, review and payout flows
- Seller KYC gate and payout balance protection
- User profiles, badges, following and seller storefronts
- Premium and Premium+ as separate tiers with Popular monthly plans
- Admin 2FA, Store controls, order controls and audit-backed APIs
- Brevo transactional email adapter with delivery records and idempotency
- No post/feed system

## Deployment
Render is configured with: `npm install && npm run db:generate && npm run db:push && npm run build`

Set the secrets in `.env.example` in the Render dashboard. The Brevo sender/domain must be verified in Brevo before production sending.

## Verification
Run:

```bash
npm run check:syntax
npm run verify
npm run qa:deep
node scripts/simulate-flows.mjs
```

The source-level suite currently passes. A real dependency install/Next production build still requires access to the npm registry and the production service credentials, so those external integrations must be completed during deployment.
