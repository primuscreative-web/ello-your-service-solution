# Stripe Connect rollout (test and live)

Stripe credentials are server-only. Never put secret keys in `VITE_` variables, source files, notes, or committed files. `VITE_STRIPE_ONLINE_PAYMENTS_ENABLED` remains `false` until the matching environment has its database migration, restricted key, Connect webhook, onboarding, and payment verification complete.

## Environment variables

Configure these in the `ello-app` Vercel environment that matches the Stripe mode:

- `STRIPE_MODE`: `test` for Preview and `live` for Production.
- `STRIPE_SECRET_KEY`: a restricted `rk_test_` or `rk_live_` key, respectively. The integration requires platform `Accounts: Write` and `Account Links: Write`, plus connected-account `Checkout Sessions: Write`.
- `STRIPE_TEST_CONNECT_WEBHOOK_SECRET` or `STRIPE_LIVE_CONNECT_WEBHOOK_SECRET`: signing secret for the matching Connect webhook destination.
- `APP_BASE_URL`: exact HTTPS origin for that environment.
- `VITE_STRIPE_ONLINE_PAYMENTS_ENABLED`: keep `false` until all checks below pass.

For local development, retrieve only Preview variables into ignored `.env.local`. Do not create a local file containing Production credentials.

## Webhook

Register `POST https://<environment-origin>/api/stripe/webhook` in the matching Stripe mode, with Connect events for connected accounts: `account.updated`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Store its signing secret in the matching server-only environment variable.

## Release gates

1. The migration `supabase/migrations/20261002215913_localhub_stripe_connect_test.sql` is applied to ELLO1 (`fahrhrcxzcnnrhjavrfk`). Verify it is applied in any other environment before enabling its payment flow.
2. Confirm Stripe account verification and Connect platform capabilities in the Dashboard.
3. Complete Connect onboarding for a dedicated business; confirm `charges_enabled`, `payouts_enabled`, and `details_submitted` via signed `account.updated` events.
4. Verify orders, duplicate webhook delivery, expired sessions, failures, and successful payment reconciliation in Stripe test mode before changing Production.
5. Only then set the Production live credentials, webhook secret, and public flag. Do not run a real charge or payout as a smoke test without a separate, explicit transaction plan.

This implementation creates direct charges on each connected business account. Funds settle to that business's Stripe balance and Stripe payout schedule; ELLO does not hold a wallet balance or control merchant withdrawals. Subscription billing for ELLO and ELLO-managed custody or withdrawals are separate integrations.
