# ZTN deployment notes

## Render

Build command:

`npm install && npm run db:generate && npm run db:push && npm run build`

Start command:

`npm start`

## Required secrets / configuration

### Neon
- `DATABASE_URL`
- `DIRECT_URL`

### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- callback: `/api/auth/google/callback`

### Didit
- `DIDIT_API_KEY`
- `DIDIT_WORKFLOW_ID`
- `DIDIT_WEBHOOK_SECRET`
- `DIDIT_API_URL`

### Backblaze B2
- `B2_ENDPOINT`
- `B2_REGION`
- `B2_BUCKET`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`

### Brevo
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO` (optional)
- `BREVO_WEBHOOK_SECRET` (optional webhook URL protection)

The sender address/domain must be verified in Brevo before production sending.

### Veritas
- `QIBR_API_URL`
- `QIBR_API_KEY`
- `QIBR_WEBHOOK_SECRET`

### Admin / app
- `ADMIN_EMAIL=muhdinnovel2@gmail.com`
- `NEXT_PUBLIC_APP_URL`
- `MARKETPLACE_AUTOCOMPLETE_SECRET`
- `DEMO_MODE=false`
- `NEXT_PUBLIC_DEMO_MODE=false`

## Brevo flow

ZTN → Brevo API → customer/admin mailbox

The application does not store a Gmail password. Brevo is the automated sender; the Admin Gmail address remains the notification inbox.

## QA

Before production cutover:

1. Set all production environment variables.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:push` for the initial schema.
5. Run `npm run build`.
6. Configure Google, Didit, Brevo, Veritas and B2 callbacks/credentials.
7. Use the deterministic simulation suite with `node scripts/simulate-flows.mjs` as a preflight contract check.


## Upgraded QA/build notes

- Subscription page separates Premium and Premium+ into distinct sections. The 1-month plan is marked Popular in each tier.
- User badge rules: Verified green; Premium blue check; Premium+ purple check; Official red Official treatment.
- Google OAuth now uses an authorization-code callback with a state cookie and sends first-time users to `/onboarding`.
- New onboarding users are automatically followed to the seeded ZTN Official account.
- Marketplace payments use the shared Veritas payment-link flow with idempotent activation.
- Marketplace delivered orders can be auto-completed after 24 hours through the protected `/api/marketplace/orders/auto-complete` route.
- Store Admin order transitions are restricted to valid state changes.
- Admin Store writes and image uploads require same-origin checks and mandatory Admin 2FA.
- Admin Store and Orders tabs expose real protected API-backed controls.
- Brevo email sending uses the transactional `/v3/smtp/email` endpoint and stores delivery/idempotency state in Neon.
- Because this environment could not resolve the npm registry, the real dependency install and Next.js production build were not executed here.
