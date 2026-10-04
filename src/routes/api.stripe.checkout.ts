import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getStripeAdminClient, getStripeBaseUrl, getStripeClient } from "@/lib/stripe.server";

const inputSchema = z.object({ orderId: z.string().uuid(), trackingToken: z.string().uuid() });

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof inputSchema>;
        try {
          input = inputSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        try {
          const supabase = getStripeAdminClient();
          const { data: order, error: orderError } = await supabase
            .from("localhub_orders")
            .select(
              "id, business_id, order_number, total, status, payment_status, payment_method, payment_timing, public_tracking_token",
            )
            .eq("id", input.orderId)
            .eq("public_tracking_token", input.trackingToken)
            .maybeSingle();
          if (orderError || !order)
            return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
          if (
            !["online_pix", "online_card"].includes(order.payment_method) ||
            order.payment_timing !== "online" ||
            ["cancelled", "completed"].includes(order.status) ||
            order.payment_status === "paid" ||
            !Number.isFinite(Number(order.total)) ||
            !Number.isSafeInteger(Math.round(Number(order.total) * 100)) ||
            Math.round(Number(order.total) * 100) <= 0
          ) {
            return Response.json(
              { error: "Este pedido não está habilitado para pagamento online." },
              { status: 409 },
            );
          }
          const { data: connectedAccount, error: accountError } = await supabase
            .from("localhub_stripe_connect_accounts")
            .select("stripe_account_id, charges_enabled")
            .eq("business_id", order.business_id)
            .maybeSingle();
          if (accountError || !connectedAccount?.charges_enabled) {
            return Response.json(
              { error: "O estabelecimento ainda não habilitou pagamentos online." },
              { status: 409 },
            );
          }

          const stripe = getStripeClient();
          const existing = await supabase
            .from("localhub_stripe_order_payments")
            .select("checkout_url, status, stripe_checkout_session_id")
            .eq("order_id", order.id)
            .maybeSingle();
          if (existing.data?.status === "paid") {
            return Response.json({ error: "Este pedido já foi pago." }, { status: 409 });
          }
          if (existing.data?.status === "expired") {
            return Response.json(
              { error: "A sessão de pagamento expirou. Faça um novo pedido." },
              { status: 409 },
            );
          }
          if (
            existing.data?.checkout_url &&
            existing.data.status === "pending" &&
            existing.data.stripe_checkout_session_id
          ) {
            const priorSession = await stripe.checkout.sessions.retrieve(
              existing.data.stripe_checkout_session_id!,
              {},
              { stripeAccount: connectedAccount.stripe_account_id },
            );
            if (priorSession.status === "open")
              return Response.json({ url: existing.data.checkout_url });
            if (priorSession.status === "expired") {
              await supabase
                .from("localhub_stripe_order_payments")
                .update({ status: "expired", updated_at: new Date().toISOString() })
                .eq("order_id", order.id)
                .eq("stripe_account_id", connectedAccount.stripe_account_id);
              return Response.json(
                { error: "A sessão expirou. Faça um novo pedido para pagar novamente." },
                { status: 409 },
              );
            }
            return Response.json(
              { error: "O pagamento está sendo confirmado. Atualize o pedido em instantes." },
              { status: 409 },
            );
          }

          const baseUrl = getStripeBaseUrl();
          const trackingUrl = `${baseUrl}/pedido/${order.public_tracking_token}`;
          const amount = Math.round(Number(order.total) * 100);
          const session = await stripe.checkout.sessions.create(
            {
              mode: "payment",
              allowed_payment_method_types:
                order.payment_method === "online_pix" ? ["pix"] : ["card"],
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency: "brl",
                    unit_amount: amount,
                    product_data: { name: `Pedido ELLO #${order.order_number}` },
                  },
                },
              ],
              success_url: `${trackingUrl}?pagamento=retorno&session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${trackingUrl}?pagamento=cancelado`,
              metadata: { ello_order_id: order.id, ello_business_id: order.business_id },
              payment_intent_data: {
                metadata: { ello_order_id: order.id, ello_business_id: order.business_id },
              },
            },
            {
              stripeAccount: connectedAccount.stripe_account_id,
              idempotencyKey: `ello-checkout-order-${order.id}`,
            },
          );
          if (!session.url) throw new Error("Checkout Stripe não retornou um endereço seguro.");

          const { error: paymentError } = await supabase
            .from("localhub_stripe_order_payments")
            .upsert({
              order_id: order.id,
              business_id: order.business_id,
              stripe_account_id: connectedAccount.stripe_account_id,
              stripe_checkout_session_id: session.id,
              checkout_url: session.url,
              status: "pending",
              amount_cents: amount,
              currency: "brl",
              updated_at: new Date().toISOString(),
            });
          if (paymentError) throw paymentError;
          const { error: orderPaymentError } = await supabase
            .from("localhub_orders")
            .update({ payment_status: "pending" })
            .eq("id", order.id);
          if (orderPaymentError) throw orderPaymentError;
          return Response.json({ url: session.url });
        } catch (error) {
          console.error(
            "Stripe Checkout unavailable",
            error instanceof Error ? error.message : "unknown",
          );
          return Response.json({ error: "Pagamentos Stripe indisponíveis." }, { status: 503 });
        }
      },
    },
  },
});
