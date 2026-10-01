# ZTN Build Verification

## Build state

Source upgrade pass completed on 2026-09-24.

## Source-level verification

- Primary source contract checks: PASS
- Deep QA checks: 9/9 PASS
- Deterministic product/flow simulations: 28/28 PASS
- TypeScript/TSX parse check: PASS (68 files)
- Strict temporary TypeScript check with external-module stubs: PASS
- Primary route-link/page sanity: PASS
- Forbidden post/feed references: 0
- ZIP integrity check: PASS

## Tested flows

- Official Store hierarchy
- Instagram Followers / Likes
- Free Fire Top Up / Level Up / Membership
- Level Up packages: Level 6, 10, 15, 20, 25, 30, All Levels
- Premium and Premium+ separated subscription UI
- Popular monthly plan marker
- KYC gate for Premium/Premium+ and Marketplace selling
- Google OAuth state/callback contract
- New-user onboarding + automatic ZTN Official follow
- Badge states: Verified / Premium / Premium+ / Official
- Store database price locking
- Veritas Store payment flow contract
- Store Admin order-state transition safety
- Marketplace listing/sale/buy/delivery/completion/review contracts
- Marketplace Veritas server-side payment confirmation + conditional activation
- Marketplace payout-balance protection
- Didit webhook status mapping/idempotency contract
- Brevo transactional email configuration + delivery records + idempotency
- Admin 2FA and protected Store/image mutations
- No post/feed system

## External build limitation

A real `npm install` could not complete in this environment because the npm registry/network request timed out. Therefore a live `next build` using the installed dependency tree was not claimed as passed. Production deployment should run:

```bash
npm install
npm run db:generate
npm run db:push
npm run build
npm start
```

## Important deployment configuration

Set the variables in `.env.example` / Render before production. In particular, configure Google OAuth, Neon, Backblaze B2, Didit, Brevo, Veritas, `NEXT_PUBLIC_APP_URL`, and `MARKETPLACE_AUTOCOMPLETE_SECRET`.

The Brevo sender/domain must be registered and verified before production sending.
