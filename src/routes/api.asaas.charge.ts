import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAsaasPixCharge,
  findOrCreateAsaasCustomer,
  getAsaasAdminSupabase,
  getAsaasPixQrCode,
  isAsaasConfigured,
} from "@/lib/asaas.server";

const chargeSchema = z.object({
  orderId: z.string().uuid(),
  trackingToken: z.string().uuid(),
  customerCpfCnpj: z.string().optional(),
});

export const Route = createFileRoute("/api/asaas/charge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof chargeSchema>;
        try {
          const body = await request.json();
          input = chargeSchema.parse(body);
        } catch {
          return Response.json({ error: "Dados inválidos para geração do Pix." }, { status: 400 });
        }

        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "O gateway Asaas ainda não foi configurado no servidor (ASAAS_API_KEY ausente)." },
            { status: 503 },
          );
        }

        try {
          const supabase = getAsaasAdminSupabase();

          // 1. Localiza o pedido com validação do token público
          const { data: order, error: orderError } = await supabase
            .from("localhub_orders")
            .select("id, business_id, order_number, customer_name, customer_phone, total, status, payment_status, payment_method")
            .eq("id", input.orderId)
            .eq("public_tracking_token", input.trackingToken)
            .maybeSingle();

          if (orderError || !order) {
            return Response.json({ error: "Pedido não localizado." }, { status: 404 });
          }

          if (order.status === "cancelled") {
            return Response.json({ error: "Este pedido foi cancelado." }, { status: 409 });
          }

          if (order.payment_status === "paid") {
            return Response.json({ error: "Este pedido já foi pago.", paid: true }, { status: 200 });
          }

          const orderTotal = Number(order.total);
          if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
            return Response.json({ error: "Valor de pedido inválido." }, { status: 422 });
          }

          // 2. Busca pagamento Asaas já existente para este pedido (idempotência)
          const { data: existingPayment } = await supabase
            .from("localhub_asaas_order_payments")
            .select("asaas_payment_id, status, pix_qr_code_payload, pix_qr_code_image, pix_expiration_date, invoice_url")
            .eq("order_id", order.id)
            .maybeSingle();

          if (
            existingPayment?.pix_qr_code_payload &&
            existingPayment.status === "pending" &&
            existingPayment.pix_expiration_date &&
            new Date(existingPayment.pix_expiration_date) > new Date()
          ) {
            return Response.json({
              success: true,
              pixPayload: existingPayment.pix_qr_code_payload,
              pixImage: existingPayment.pix_qr_code_image,
              expirationDate: existingPayment.pix_expiration_date,
              invoiceUrl: existingPayment.invoice_url,
            });
          }

          // 3. Localiza dados do negócio
          const { data: business } = await supabase
            .from("localhub_businesses")
            .select("id, name, slug")
            .eq("id", order.business_id)
            .single();

          // 4. Cria ou localiza o cliente no Asaas
          const asaasCustomerId = await findOrCreateAsaasCustomer({
            name: order.customer_name || "Cliente ELLO",
            phone: order.customer_phone,
            cpfCnpj: input.customerCpfCnpj,
          });

          // 5. Gera a cobrança Pix no Asaas
          const payment = await createAsaasPixCharge({
            customerId: asaasCustomerId,
            value: orderTotal,
            description: `Pedido #${order.order_number} - ${business?.name ?? "ELLO"}`,
            externalReference: order.id,
          });

          // 6. Obtém o QR Code e o Copia-e-Cola
          const pixData = await getAsaasPixQrCode(payment.id);

          // 7. Persiste o registro de pagamento atrelado ao pedido
          const amountCents = Math.round(orderTotal * 100);
          await supabase.from("localhub_asaas_order_payments").upsert({
            order_id: order.id,
            business_id: order.business_id,
            asaas_payment_id: payment.id,
            asaas_customer_id: asaasCustomerId,
            billing_type: "PIX",
            status: "pending",
            pix_qr_code_payload: pixData.payload,
            pix_qr_code_image: pixData.encodedImage,
            pix_expiration_date: pixData.expirationDate,
            amount_cents: amountCents,
            invoice_url: payment.invoiceUrl ?? null,
            updated_at: new Date().toISOString(),
          });

          // 8. Registra no ledger financeiro da carteira como transação pendente
          await supabase.from("localhub_wallet_transactions").upsert(
            {
              business_id: order.business_id,
              provider_transaction_id: payment.id,
              transaction_type: "sale",
              status: "pending",
              amount_cents: amountCents,
              description: `Venda Pix - Pedido #${order.order_number}`,
            },
            { onConflict: "provider_transaction_id" },
          );

          // 9. Atualiza o pedido para status pendente de pagamento
          await supabase
            .from("localhub_orders")
            .update({
              payment_status: "pending",
              payment_method: "online_pix",
              payment_timing: "online",
            })
            .eq("id", order.id);

          return Response.json({
            success: true,
            pixPayload: pixData.payload,
            pixImage: pixData.encodedImage,
            expirationDate: pixData.expirationDate,
            invoiceUrl: payment.invoiceUrl,
          });
        } catch (error) {
          console.error("Asaas charge generation failed", error instanceof Error ? error.message : error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Não foi possível gerar a chave Pix no momento.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
