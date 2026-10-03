# ZTN Fresh Build — A+B Validation Status

## Completed in this patch

- Fresh project tree remains independent from the old ZTN project.
- Security review fixes applied: exposed Waliya token route removed, server-owned payment amounts, authenticated sensitive APIs, fail-closed admin, signed Veritas webhook verification, signed Didit webhook verification and real database state updates.
- Real marketplace order creation with a server-calculated 5% commission and seller-net payout record.
- Real Veritas hosted checkout creation from the order/store-order amount stored in Neon.
- Real Waliya catalog lookup for Free Fire and server-side Waliya order dispatch after verified payment.
- Instagram Followers/ Likes order creation with the agreed server-side pricing rules and manual admin fulfillment state.
- Didit webhook updates the user KYC state.
- Database-backed admin Orders, Sellers, Products, Users, Payments, Payouts, Official Store, KYC, Disputes, Analytics and Audit Logs screens.
- KYC is enforced before publishing a marketplace listing or purchasing Premium/Premium+.
- R2 uploads require login, use server-generated keys, restrict file types to JPG/PNG/WEBP, and sign the content length.
- Seller-page browsing is public; seller actions remain protected. Guest checkout receives a per-order checkout token so checkout cannot be started from an arbitrary guessed order id.
- Marketplace orders auto-complete after the 24-hour hold through a fail-closed hourly Cloudflare Cron Trigger (calls the cron route).
- No fake seller/order/revenue statistics remain in production UI copy.
- Free Fire does not use a separate UID-validation API. The user confirms the entered UID before payment.
- Exact user-supplied badge SVG geometry is preserved; sizing adapts by context.

## Validation performed here

- `npm run smoke` equivalent — PASS (34 App Router page files inspected).
- Internal-link check — PASS (31 static link references inspected).
- TypeScript/TSX source syntax transpilation check — PASS (83 files; 0 syntax errors).
- Fake-data / demo-payment / exposed-Waliya-token scan — PASS.
- Waliya token endpoint is absent from the source tree.
- ZIP integrity will be checked after packaging.

## Environment limitation

This environment cannot access the npm registry reliably and has no installed project dependencies, so a truthful `npm install`, `npm run typecheck`, Prisma validation, or `npm run build` cannot be claimed here. The package contains the full manifest and setup instructions for a normal environment with registry access.

## Required first local validation

```bash
npm install
npm run db:generate
npm run typecheck
npm run build
npm run dev
```

Then configure the private environment variables in `.env.local` / `.dev.vars` / Cloudflare secrets and run a real test payment before production use.
