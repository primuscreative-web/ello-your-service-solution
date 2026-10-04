import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { getStripeAdminClient, getStripeClient } from "@/lib/stripe.server";
import { getStripeServerConfig } from "@/lib/config.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const webhookSecret = getStripeServerConfig().connectWebhookSecret;
        if (!signature || !webhookSecret) {
          return Response.json({ error: "Webhook Stripe não configurado." }, { status: 503 });
        }
        let event: Stripe.Event;
        try {
          event = getStripeClient().webhooks.constructEvent(
            await request.text(),
            signature,
            webhookSecret,
          );
        } catch {
          return Response.json({ error: "Assinatura inválida." }, { status: 400 });
        }

        try {
          const supabase = getStripeAdminClient();
          const { data: processedEvent, error: lookupError } = await supabase
            .from("localhub_stripe_webhook_events")
            .select("event_id")
            .eq("event_id", event.id)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (processedEvent) return Response.json({ received: true, duplicate: true });

          if (event.type === "account.updated") {
            const account = event.data.object as Stripe.Account;
            const { error } = await supabase
              .from("localhub_stripe_connect_accounts")
              .update({
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_account_id", account.id);
            if (error) throw error;
          }
          if (
            event.type === "checkout.session.completed" ||
            event.type === "checkout.session.async_payment_succeeded" ||
            event.type === "checkout.session.expired" ||
            event.type === "checkout.session.async_payment_failed"
          ) {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.ello_order_id;
            const accountId = event.account;
            if (orderId && accountId) {
              const { data: payment, error: paymentError } = await supabase
                .from("localhub_stripe_order_payments")
                .select("business_id, amount_cents, currency, status")
                .eq("order_id", orderId)
                .eq("stripe_account_id", accountId)
                .eq("stripe_checkout_session_id", session.id)
                .maybeSingle();
              if (paymentError) throw paymentError;
              const amountMatches =
                payment &&
                session.amount_total === Number(payment.amount_cents) &&
                session.currency === payment.currency;
              if (payment && amountMatches) {
                if (
                  (event.type === "checkout.session.completed" ||
                    event.type === "checkout.session.async_payment_succeeded") &&
                  session.payment_status === "paid" &&
                  !["refunded", "disputed"].includes(payment.status)
                ) {
                  const { error } = await supabase
                    .from("localhub_orders")
                    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
                    .eq("id", orderId)
                    .eq("business_id", payment.business_id);
                  if (error) throw error;
                  const { error: updatePaymentError } = await supabase
                    .from("localhub_stripe_order_payments")
                    .update({
                      status: "paid",
                      stripe_payment_intent_id:
                        typeof session.payment_intent === "string" ? session.payment_intent : null,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("order_id", orderId)
                    .eq("stripe_account_id", accountId)
                    .eq("stripe_checkout_session_id", session.id);
                  if (updatePaymentError) throw updatePaymentError;
                } else if (
                  event.type === "checkout.session.expired" ||
                  event.type === "checkout.session.async_payment_failed"
                ) {
                  const nextStatus =
                    event.type === "checkout.session.expired" ? "expired" : "failed";
                  if (payment.status === "pending") {
                    const { error: updatePaymentError } = await supabase
                      .from("localhub_stripe_order_payments")
                      .update({ status: nextStatus, updated_at: new Date().toISOString() })
                      .eq("order_id", orderId)
                      .eq("business_id", payment.business_id)
                      .eq("stripe_account_id", accountId)
                      .eq("stripe_checkout_session_id", session.id)
                      .eq("status", "pending");
                    if (updatePaymentError) throw updatePaymentError;
                    if (nextStatus === "failed") {
                      const { error: orderError } = await supabase
                        .from("localhub_orders")
                        .update({ payment_status: "failed", updated_at: new Date().toISOString() })
                        .eq("id", orderId)
                        .eq("business_id", payment.business_id);
                      if (orderError) throw orderError;
                    }
                  }
                }
              } else {
                console.warn("Stripe Checkout event did not match a local payment", {
                  eventId: event.id,
                  eventType: event.type,
                });
              }
            }
          }
          const { error: eventError } = await supabase
            .from("localhub_stripe_webhook_events")
            .upsert(
              { event_id: event.id, event_type: event.type },
              { onConflict: "event_id", ignoreDuplicates: true },
            );
          if (eventError) throw eventError;
          return Response.json({ received: true });
        } catch (error) {
          console.error(
            "Stripe webhook processing failed",
            error instanceof Error ? error.message : "unknown",
          );
          return Response.json({ error: "Falha ao processar evento Stripe." }, { status: 500 });
        }
      },
    },
  },
});
