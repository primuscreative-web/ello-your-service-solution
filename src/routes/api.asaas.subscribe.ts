import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAsaasUnifiedCharge,
  findOrCreateAsaasCustomer,
  getAsaasAdminSupabase,
  getAsaasPixQrCode,
  isAsaasConfigured,
} from "@/lib/asaas.server";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/security.server";

const subscribeSchema = z.object({
  planId: z.enum(["pro", "business"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerCpfCnpj: z.string().min(11, "CPF ou CNPJ inválido"),
  businessName: z.string().optional(),
  businessId: z.string().optional(),
});

export const Route = createFileRoute("/api/asaas/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Rate Limiting por IP (Proteção contra flood: máx 15 req/min)
        const ip = getClientIp(request);
        const ipRateLimit = checkRateLimit(`subscribe-ip:${ip}`, 15, 60_000);
        if (!ipRateLimit.allowed) {
          return createRateLimitResponse(ipRateLimit.resetSeconds);
        }

        let input: z.infer<typeof subscribeSchema>;
        try {
          const body = await request.json();
          input = subscribeSchema.parse(body);
        } catch (err: unknown) {
          const errorMsg = err instanceof z.ZodError ? err.errors[0]?.message : "Dados inválidos.";
          return Response.json({ error: errorMsg || "Dados inválidos para assinatura." }, { status: 400 });
        }

        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "O gateway Asaas não está configurado no servidor." },
            { status: 503 },
          );
        }

        // Limpa CPF/CNPJ e Telefone
        const cleanCpfCnpj = input.customerCpfCnpj.replace(/\D/g, "");
        const cleanPhone = input.customerPhone.replace(/\D/g, "");

        if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
          return Response.json(
            { error: "CPF deve conter 11 dígitos ou CNPJ deve conter 14 dígitos válidos." },
            { status: 400 },
          );
        }

        // Cálculo do valor exato
        let amount = 39.9;
        if (input.planId === "pro") {
          amount = input.billingCycle === "yearly" ? 358.8 : 39.9;
        } else if (input.planId === "business") {
          amount = input.billingCycle === "yearly" ? 718.8 : 79.9;
        }

        const planTitle = input.planId === "pro" ? "Plano Pro" : "Plano Business";
        const cycleTitle = input.billingCycle === "yearly" ? "Anual (25% OFF)" : "Mensal";
        const bizTitle = input.businessName?.trim() || "Empresa";

        try {
          // 2. Cria ou localiza o cliente no Asaas (Conta Master)
          const customerId = await findOrCreateAsaasCustomer({
            name: input.customerName.trim(),
            cpfCnpj: cleanCpfCnpj,
            email: input.customerEmail.trim(),
            phone: cleanPhone,
          });

          // 3. Cria a cobrança PIX no Asaas
          const externalRef = `sub_${input.planId}_${input.billingCycle}_${input.businessId || "new"}_${Date.now()}`;
          const payment = await createAsaasUnifiedCharge({
            customerId,
            value: amount,
            description: `Assinatura ELLO ${planTitle} (${cycleTitle}) - ${bizTitle}`,
            externalReference: externalRef,
            billingType: "PIX",
          });

          // 4. Busca o QR Code e Payload PIX oficial gerado pelo Asaas
          const pixData = await getAsaasPixQrCode(payment.id);

          // 5. Se houver businessId, salva o id da cobrança de assinatura para histórico
          if (input.businessId) {
            try {
              const supabase = getAsaasAdminSupabase();
              await supabase
                .from("localhub_businesses")
                .update({
                  onboarding_details: {
                    pendingSubscription: {
                      paymentId: payment.id,
                      plan: input.planId,
                      billingCycle: input.billingCycle,
                      value: amount,
                      createdAt: new Date().toISOString(),
                    },
                  },
                })
                .eq("id", input.businessId);
            } catch {
              // não bloqueia se Supabase falhar na gravação do pending
            }
          }

          return Response.json({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            value: payment.value,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl,
            pix: {
              encodedImage: pixData.encodedImage,
              payload: pixData.payload,
              expirationDate: pixData.expirationDate,
            },
          });
        } catch (err: unknown) {
          console.error("Erro ao gerar assinatura Asaas:", err);
          const message = err instanceof Error ? err.message : "Erro desconhecido ao processar assinatura no Asaas.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
