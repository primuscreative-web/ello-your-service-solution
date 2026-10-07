import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAsaasUnifiedCharge,
  findOrCreateAsaasCustomer,
  getAsaasAdminSupabase,
  getAsaasPixQrCode,
  isAsaasConfigured,
} from "@/lib/asaas.server";

import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/security.server";

const creditCardSchema = z.object({
  holderName: z.string().min(2).max(100),
  number: z.string().min(13).max(19),
  expiryMonth: z.string().length(2),
  expiryYear: z.string().length(4),
  ccv: z.string().min(3).max(4),
});

const chargeSchema = z.object({
  orderId: z.string().uuid(),
  trackingToken: z.string().uuid(),
  customerCpfCnpj: z.string().max(20).optional(),
  billingType: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]).default("PIX"),
  creditCard: creditCardSchema.optional(),
  creditCardHolderInfo: z
    .object({
      name: z.string().max(120),
      email: z.string().email().max(120),
      cpfCnpj: z.string().max(20),
      postalCode: z.string().max(12),
      addressNumber: z.string().max(20),
      phone: z.string().max(30),
    })
    .optional(),
  installmentCount: z.number().int().min(1).max(12).optional(),
});

export const Route = createFileRoute("/api/asaas/charge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Rate Limiting por IP (Proteção Anti-Carding e Anti-Flood: máx 12 req/min)
        const ip = getClientIp(request);
        const ipRateLimit = checkRateLimit(`charge-ip:${ip}`, 12, 60_000);
        if (!ipRateLimit.allowed) {
          return createRateLimitResponse(ipRateLimit.resetSeconds);
        }

        let input: z.infer<typeof chargeSchema>;
        try {
          const body = await request.json();
          input = chargeSchema.parse(body);
        } catch {
          return Response.json(
            { error: "Dados inválidos para geração da cobrança." },
            { status: 400 },
          );
        }

        // 2. Rate Limiting por Pedido (Máx 5 tentativas de pagamento por pedido em 10 min)
        const orderRateLimit = checkRateLimit(`charge-order:${input.orderId}`, 5, 600_000);
        if (!orderRateLimit.allowed) {
          return Response.json(
            { error: "Limite de tentativas de pagamento para este pedido excedido. Aguarde alguns minutos." },
            { status: 429 },
          );
        }

        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "O gateway de pagamento ainda não foi configurado no servidor." },
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

          // 2. Busca subconta Asaas do estabelecimento
          const { data: paymentAccount } = await supabase
            .from("localhub_payment_accounts")
            .select("subaccount_api_key, wallet_id, sales_enabled, onboarding_status")
            .eq("business_id", order.business_id)
            .maybeSingle();

          const subaccountApiKey = paymentAccount?.subaccount_api_key ?? undefined;

          // 3. Busca pagamento Asaas já existente para este pedido (idempotência)
          const { data: existingPayment } = await supabase
            .from("localhub_asaas_order_payments")
            .select("asaas_payment_id, status, billing_type, pix_qr_code_payload, pix_qr_code_image, pix_expiration_date, invoice_url")
            .eq("order_id", order.id)
            .maybeSingle();

          if (
            existingPayment &&
            existingPayment.status === "pending" &&
            existingPayment.billing_type === input.billingType
          ) {
            if (
              input.billingType === "PIX" &&
              existingPayment.pix_qr_code_payload &&
              existingPayment.pix_expiration_date &&
              new Date(existingPayment.pix_expiration_date) > new Date()
            ) {
              return Response.json({
                success: true,
                billingType: "PIX",
                pixPayload: existingPayment.pix_qr_code_payload,
                pixImage: existingPayment.pix_qr_code_image,
                expirationDate: existingPayment.pix_expiration_date,
                invoiceUrl: existingPayment.invoice_url,
              });
            }

            if (input.billingType === "CREDIT_CARD" && existingPayment.invoice_url) {
              return Response.json({
                success: true,
                billingType: "CREDIT_CARD",
                invoiceUrl: existingPayment.invoice_url,
              });
            }
          }

          // 4. Localiza dados do negócio
          const { data: business } = await supabase
            .from("localhub_businesses")
            .select("id, name, slug")
            .eq("id", order.business_id)
            .single();

          // 5. Cria ou localiza o cliente no Asaas
          const asaasCustomerId = await findOrCreateAsaasCustomer(
            {
              name: order.customer_name || "Cliente ELLO",
              phone: order.customer_phone,
              cpfCnpj: input.customerCpfCnpj,
            },
            subaccountApiKey,
          );

          // 6. Gera a cobrança (Pix ou Cartão) no Asaas
          const payment = await createAsaasUnifiedCharge(
            {
              customerId: asaasCustomerId,
              value: orderTotal,
              description: `Pedido #${order.order_number} - ${business?.name ?? "ELLO"}`,
              externalReference: order.id,
              billingType: input.billingType,
              creditCard: input.creditCard,
              creditCardHolderInfo: input.creditCardHolderInfo,
              installmentCount: input.installmentCount,
            },
            subaccountApiKey,
          );

          let pixPayload: string | null = null;
          let pixImage: string | null = null;
          let expirationDate: string | null = null;

          if (input.billingType === "PIX") {
            try {
              const pixData = await getAsaasPixQrCode(payment.id, subaccountApiKey);
              pixPayload = pixData.payload;
              pixImage = pixData.encodedImage;
              expirationDate = pixData.expirationDate;
            } catch (qrErr) {
              console.warn("Falha ao gerar QR Code Pix direto:", qrErr);
            }
          }

          const amountCents = Math.round(orderTotal * 100);
          const isImmediateSuccess =
            payment.status === "CONFIRMED" || payment.status === "RECEIVED";

          // 7. Persiste o registro de pagamento
          await supabase.from("localhub_asaas_order_payments").upsert({
            order_id: order.id,
            business_id: order.business_id,
            asaas_payment_id: payment.id,
            asaas_customer_id: asaasCustomerId,
            billing_type: input.billingType,
            status: isImmediateSuccess ? "confirmed" : "pending",
            pix_qr_code_payload: pixPayload,
            pix_qr_code_image: pixImage,
            pix_expiration_date: expirationDate,
            amount_cents: amountCents,
            invoice_url: payment.invoiceUrl ?? null,
            credit_card_brand: payment.creditCard?.creditCardBrand ?? null,
            credit_card_last4: payment.creditCard?.creditCardNumber
              ? payment.creditCard.creditCardNumber.slice(-4)
              : null,
            installments: input.installmentCount ?? 1,
            updated_at: new Date().toISOString(),
          });

          // 8. Registra no ledger financeiro da carteira
          await supabase.from("localhub_wallet_transactions").upsert(
            {
              business_id: order.business_id,
              provider_transaction_id: payment.id,
              transaction_type: "sale",
              status: isImmediateSuccess ? "available" : "pending",
              amount_cents: amountCents,
              description: `Venda ${input.billingType === "PIX" ? "Pix" : "Cartão"} - Pedido #${order.order_number}`,
            },
            { onConflict: "provider_transaction_id" },
          );

          // 9. Atualiza o pedido
          await supabase
            .from("localhub_orders")
            .update({
              payment_status: isImmediateSuccess ? "paid" : "pending",
              payment_method: input.billingType === "PIX" ? "online_pix" : "online_card",
              payment_timing: "online",
            })
            .eq("id", order.id);

          return Response.json({
            success: true,
            billingType: input.billingType,
            pixPayload,
            pixImage,
            expirationDate,
            invoiceUrl: payment.invoiceUrl,
            paid: isImmediateSuccess,
          });
        } catch (error) {
          console.error("Asaas charge generation failed:", error instanceof Error ? error.message : error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Não foi possível gerar a cobrança no momento.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
