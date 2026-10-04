import { createFileRoute } from "@tanstack/react-router";
import { getAsaasAdminSupabase, verifyAsaasWebhookToken } from "@/lib/asaas.server";

type AsaasWebhookPayload = {
  event:
    | "PAYMENT_CREATED"
    | "PAYMENT_UPDATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_REVERSED"
    | "PAYMENT_DELETED";
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue?: number;
    billingType: string;
    status: string;
    externalReference?: string;
    confirmedDate?: string;
    paymentDate?: string;
  };
};

export const Route = createFileRoute("/api/asaas/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const receivedToken = request.headers.get("asaas-access-token");
        if (!verifyAsaasWebhookToken(receivedToken)) {
          return Response.json({ error: "Token de webhook Asaas inválido." }, { status: 401 });
        }

        let body: AsaasWebhookPayload;
        try {
          body = (await request.json()) as AsaasWebhookPayload;
        } catch {
          return Response.json({ error: "Payload inválido." }, { status: 400 });
        }

        if (!body.event || !body.payment?.id) {
          return Response.json({ error: "Formato de evento inválido." }, { status: 400 });
        }

        const supabase = getAsaasAdminSupabase();
        const eventId = `${body.event}_${body.payment.id}_${body.payment.status}`;

        // 1. Checagem de idempotência
        const { data: existingEvent } = await supabase
          .from("localhub_asaas_webhook_events")
          .select("event_id")
          .eq("event_id", eventId)
          .maybeSingle();

        if (existingEvent) {
          return Response.json({ received: true, duplicate: true });
        }

        try {
          const paymentId = body.payment.id;
          const orderId = body.payment.externalReference;

          // 2. Localiza o registro de pagamento
          let orderPaymentQuery = supabase
            .from("localhub_asaas_order_payments")
            .select("order_id, business_id, status, amount_cents")
            .eq("asaas_payment_id", paymentId);

          let { data: orderPayment } = await orderPaymentQuery.maybeSingle();

          if (!orderPayment && orderId) {
            const fallbackQuery = await supabase
              .from("localhub_asaas_order_payments")
              .select("order_id, business_id, status, amount_cents")
              .eq("order_id", orderId)
              .maybeSingle();
            orderPayment = fallbackQuery.data;
          }

          if (orderPayment) {
            const targetOrderId = orderPayment.order_id;
            const businessId = orderPayment.business_id;

            // 3. Processa eventos de confirmação / recebimento do Pix
            if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
              // Atualiza pagamento local
              await supabase
                .from("localhub_asaas_order_payments")
                .update({
                  status: "confirmed",
                  updated_at: new Date().toISOString(),
                })
                .eq("order_id", targetOrderId);

              // Atualiza pedido para 'paid'
              await supabase
                .from("localhub_orders")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", targetOrderId);

              // Libera transação na carteira
              await supabase
                .from("localhub_wallet_transactions")
                .update({
                  status: "available",
                  available_at: new Date().toISOString(),
                })
                .eq("provider_transaction_id", paymentId);
            }

            // 4. Processa estorno / cancelamento
            if (body.event === "PAYMENT_REFUNDED" || body.event === "PAYMENT_REVERSED") {
              await supabase
                .from("localhub_asaas_order_payments")
                .update({ status: "refunded", updated_at: new Date().toISOString() })
                .eq("order_id", targetOrderId);

              await supabase
                .from("localhub_orders")
                .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
                .eq("id", targetOrderId);

              await supabase.from("localhub_wallet_transactions").upsert({
                business_id: businessId,
                provider_transaction_id: `${paymentId}_refund`,
                transaction_type: "refund",
                status: "completed",
                amount_cents: -Math.abs(orderPayment.amount_cents),
                description: `Estorno Pix - Pedido #${targetOrderId.slice(0, 8)}`,
              });
            }

            // 5. Processa expiração
            if (body.event === "PAYMENT_OVERDUE") {
              await supabase
                .from("localhub_asaas_order_payments")
                .update({ status: "overdue", updated_at: new Date().toISOString() })
                .eq("order_id", targetOrderId);

              await supabase
                .from("localhub_orders")
                .update({ payment_status: "failed", updated_at: new Date().toISOString() })
                .eq("id", targetOrderId)
                .eq("payment_status", "pending");
            }
          }

          // 6. Registra evento na tabela de deduplicação
          await supabase.from("localhub_asaas_webhook_events").insert({
            event_id: eventId,
            event_type: body.event,
          });

          return Response.json({ received: true });
        } catch (error) {
          console.error("Asaas webhook processing error", error);
          return Response.json({ error: "Erro ao processar evento." }, { status: 500 });
        }
      },
    },
  },
});
