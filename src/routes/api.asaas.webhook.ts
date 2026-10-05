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
    | "PAYMENT_DELETED"
    | "TRANSFER_CREATED"
    | "TRANSFER_PENDING"
    | "TRANSFER_IN_BANK_PROCESSING"
    | "TRANSFER_BLOCKED"
    | "TRANSFER_DONE"
    | "TRANSFER_FAILED"
    | "TRANSFER_CANCELLED";
  payment?: {
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
  transfer?: {
    id: string;
    value: number;
    netValue?: number;
    status: string;
    transferFee?: number;
    effectiveDate?: string;
    failReason?: string;
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

        if (!body.event) {
          return Response.json({ error: "Evento não especificado." }, { status: 400 });
        }

        const supabase = getAsaasAdminSupabase();
        const entityId = body.payment?.id || body.transfer?.id || "unknown";
        const eventId = `${body.event}_${entityId}_${Date.now()}`;

        // 1. Checagem de idempotência
        const { data: existingEvent } = await supabase
          .from("localhub_asaas_webhook_events")
          .select("event_id")
          .eq("event_id", `${body.event}_${entityId}`)
          .maybeSingle();

        if (existingEvent) {
          return Response.json({ received: true, duplicate: true });
        }

        try {
          // Trata eventos de transferência / saque
          if (body.transfer?.id) {
            const transferId = body.transfer.id;
            if (body.event === "TRANSFER_DONE") {
              await supabase
                .from("localhub_wallet_withdrawals")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                })
                .eq("provider_transfer_id", transferId);

              await supabase
                .from("localhub_wallet_transactions")
                .update({ status: "completed" })
                .eq("provider_transaction_id", transferId);
            } else if (body.event === "TRANSFER_FAILED" || body.event === "TRANSFER_CANCELLED") {
              await supabase
                .from("localhub_wallet_withdrawals")
                .update({
                  status: "failed",
                  failure_reason: body.transfer.failReason || "Falha na transferência bancária.",
                })
                .eq("provider_transfer_id", transferId);

              await supabase
                .from("localhub_wallet_transactions")
                .update({ status: "failed" })
                .eq("provider_transaction_id", transferId);
            }
          }

          // Trata eventos de pagamento
          if (body.payment?.id) {
            const paymentId = body.payment.id;
            const orderId = body.payment.externalReference;

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

              // Confirmação de pagamento (Pix ou Cartão)
              if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
                await supabase
                  .from("localhub_asaas_order_payments")
                  .update({
                    status: "confirmed",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("order_id", targetOrderId);

                await supabase
                  .from("localhub_orders")
                  .update({
                    payment_status: "paid",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", targetOrderId);

                await supabase
                  .from("localhub_wallet_transactions")
                  .update({
                    status: "available",
                    available_at: new Date().toISOString(),
                  })
                  .eq("provider_transaction_id", paymentId);
              }

              // Estorno / Devolução
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
                  description: `Estorno Asaas - Pedido #${targetOrderId.slice(0, 8)}`,
                });
              }

              // Expiração
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
          }

          // Registra na deduplicação
          await supabase.from("localhub_asaas_webhook_events").insert({
            event_id: `${body.event}_${entityId}`,
            event_type: body.event,
          });

          return Response.json({ received: true });
        } catch (error) {
          console.error("Asaas webhook processing error:", error);
          return Response.json({ error: "Erro ao processar evento." }, { status: 500 });
        }
      },
    },
  },
});
