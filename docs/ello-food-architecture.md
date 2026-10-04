# ELLO Food architecture

The restaurant module is a tenant-scoped extension of the existing ELLO business, catalog, and order core. Its schema is introduced by `20260929150000_localhub_food_platform.sql`; apply that migration before deploying code that reads these fields or tables.

## Order ingestion contract

`POST /api/v1/orders/external` is an authenticated, server-side ingestion boundary for a future WhatsApp provider or another trusted order source. It accepts a bearer token configured as `FOOD_ORDER_INGESTION_TOKEN`; the Supabase service-role key is read only on the server. Never use the public anon key as the bearer token or expose either server secret in a `VITE_` variable.

Example request:

```json
{
  "businessSlug": "brasa-da-vila",
  "externalReference": "provider-message-123",
  "customer": { "name": "Ana Silva", "phoneE164": "+5511999999999" },
  "fulfillment": "delivery",
  "deliveryAddress": "Rua A, 10, Centro",
  "notes": "Sem cebola",
  "paymentMethod": "cash",
  "items": [{ "id": "00000000-0000-4000-8000-000000000000", "quantity": 2 }]
}
```

The database recalculates item prices, delivery fees, and order totals. The external reference is unique per business and source, so retrying the same request returns the existing order rather than duplicating it. Customer phones are normalized into E.164 before CRM storage. External orders are marked `whatsapp_ai_bot`; this contract does not implement a bot, LLM, transcription, or message sender.

## Current operational surfaces

- Public menu, pickup/delivery/dine-in choice when enabled, order submission, and a tokenized status page.
- Order queue with polling, new-order sound when browser audio is available, status progression, driver assignment, and manual 58/80 mm receipt printing.
- Owner-facing delivery area/driver management, customer segments, coupon creation, consent-gated abandoned-cart recovery queue, and a cash register with manual orders, movements, and closeout summary.
- Product fiscal fields and NFC-e/NF-e emission records are preparatory only. They do not produce tax documents or assert fiscal compliance.
- CRM reminders can be queued only for customers with marketing consent. No SMS, email, or WhatsApp provider dispatch is enabled.

## Explicit follow-up integrations

Product variant/complement selection, server-authoritative pricing, coupon preview/redemption with usage limits, consent-gated abandoned-cart capture/recovery preparation, and trackable campaign links are implemented in the application. Recovery consent is separate from marketing consent, can be revoked, and never triggers an automatic send. Owners can queue one WhatsApp recovery reminder only after 30 minutes of inactivity and within seven days; provider-backed delivery is not enabled. CRM staff can record loyalty redemptions after confirming the customer in person; the owner-only RPC locks and updates the balance and ledger atomically. Points redeem at 100 points per R$ 1. Campaign links use unique business-scoped slugs, count valid opens through `localhub_open_food_campaign`, and can attach an active coupon prefilled on the public menu. Online orders from campaign links are attributed with the order tracking token; counts are idempotent and represent submitted orders, not paid or non-cancelled orders. Apply migrations `20260929170000_localhub_food_product_choices.sql`, `20260929180000_localhub_food_coupon_checkout.sql`, `20260929190000_localhub_food_loyalty_staff_redemption.sql`, `20260929200000_localhub_food_abandoned_cart_recovery.sql`, `20260929210000_localhub_food_campaign_links.sql`, and `20260929220000_localhub_food_campaign_attribution.sql` before enabling these features in production. Public checkout redemption remains disabled until customer identity verification is available. Online card/Pix settlement, provider-backed messaging, radius-based pricing, and NFC-e/NF-e transmission still require dedicated integrations before being enabled for customers.

## Optional Asaas wallet for businesses

Migration `20261002120000_localhub_asaas_wallet_and_food_images.sql` introduces an owner-controlled opt-in for routing a business's online sales through its own Asaas-linked wallet. It stores provider account/wallet identifiers, onboarding state, and a transaction ledger. Owners can read only their own profile and ledger; the server/service role owns provider identifiers and financial writes. The opt-in RPC records an activation request only; it does not create an Asaas subaccount, accept payments, calculate or distribute commission, or initiate withdrawals.

The product rule is one provider wallet per business/titular, never one wallet per ownership share. ELLO subscription billing remains separate from merchant settlement. `ASAAS_API_KEY` and `ASAAS_WEBHOOK_TOKEN` are server-only placeholders; do not set production credentials until Asaas has approved the account/subaccount commercial arrangement. Before enabling real operations, implement authenticated server endpoints for subaccount onboarding, checkout/charge creation, verified and idempotent payment/transfer webhooks, available-balance reconciliation, authorized withdrawals, refunds/reversals, and audit logs. Confirm per-subaccount pricing, KYC, transaction limits, fees and payout timing in the ELLO parent account.

## Food product photos

The same migration adds `localhub_services.image_url` and the public `localhub-products` bucket (JPG/PNG/WebP, maximum 5 MB). Upload paths are scoped to the signed-in owner and business ID; clients can read menu images publicly but cannot upload into another business's folder. Product tax fields remain in the database for a future fiscal integration, but are removed from the restaurant catalog form until there is an actual fiscal workflow.
