import { createFileRoute } from "@tanstack/react-router";
import { privateNoStoreJson } from "@/lib/security.server";
import { z } from "zod";
import {
  createAsaasTransfer,
  getAsaasAdminSupabase,
  getAsaasBalance,
  isAsaasConfigured,
} from "@/lib/asaas.server";

import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  maskSensitiveData,
} from "@/lib/security.server";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";

const withdrawInputSchema = z.object({
  businessId: z.string().uuid(),
  amountCents: z
    .number()
    .int()
    .min(500, "O valor mínimo para transferência é de R$ 5,00.")
    .max(5_000_000, "O valor máximo por transferência é de R$ 50.000,00."),
});

const pixKeyTypeSchema = z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]);

export const Route = createFileRoute("/api/asaas/withdraw")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!PAYMENT_POLICY.professionalWalletEnabled) {
          return privateNoStoreJson(
            { error: "Saques estão desativados até a validação de saldo e liquidação." },
            { status: 503 },
          );
        }

        // 1. Rate Limiting por IP (Máx 5 req/min)
        const ip = getClientIp(request);
        const ipLimit = checkRateLimit(`withdraw-ip:${ip}`, 5, 60_000);
        if (!ipLimit.allowed) {
          return createRateLimitResponse(ipLimit.resetSeconds);
        }

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return privateNoStoreJson({ error: "Autenticação necessária." }, { status: 401 });
        }

        let input: z.infer<typeof withdrawInputSchema>;
        try {
          input = withdrawInputSchema.parse(await request.json());
        } catch (err) {
          const msg =
            err instanceof z.ZodError
              ? err.issues[0]?.message || "Dados inválidos para saque."
              : "Dados inválidos para saque.";
          return privateNoStoreJson({ error: msg }, { status: 400 });
        }

        // 2. Rate Limiting por Negócio (Máx 3 saques por 5 minutos para evitar esvaziamento concorrente)
        const bizLimit = checkRateLimit(`withdraw-biz:${input.businessId}`, 3, 300_000);
        if (!bizLimit.allowed) {
          return privateNoStoreJson(
            {
              error:
                "Limite de solicitações de saque atingido para este período. Aguarde 5 minutos.",
            },
            { status: 429 },
          );
        }

        if (!isAsaasConfigured()) {
          return privateNoStoreJson(
            { error: "Gateway Asaas não configurado no servidor." },
            { status: 503 },
          );
        }

        try {
          const supabase = getAsaasAdminSupabase();
          const { data: auth, error: authError } = await supabase.auth.getUser(token);
          if (authError || !auth.user) {
            return privateNoStoreJson({ error: "Sessão inválida." }, { status: 401 });
          }

          const { data: business } = await supabase
            .from("localhub_businesses")
            .select("id, owner_id, name")
            .eq("id", input.businessId)
            .eq("owner_id", auth.user.id)
            .maybeSingle();

          if (!business) {
            return privateNoStoreJson(
              { error: "Negócio não encontrado ou acesso não autorizado." },
              { status: 404 },
            );
          }

          // 3. Prevenção de Race Condition: Checa se há transferência em andamento nos últimos 60 segundos
          const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
          const { data: inFlightWithdrawal } = await supabase
            .from("localhub_wallet_withdrawals")
            .select("id")
            .eq("business_id", input.businessId)
            .eq("status", "processing")
            .gte("created_at", sixtySecondsAgo)
            .limit(1);

          if (inFlightWithdrawal && inFlightWithdrawal.length > 0) {
            return privateNoStoreJson(
              {
                error:
                  "Já existe uma transferência em processamento para este negócio. Aguarde a confirmação.",
              },
              { status: 409 },
            );
          }

          const { data: account } = await supabase
            .from("localhub_payment_accounts")
            .select(
              "provider, sales_enabled, subaccount_api_key, wallet_id, pix_key, pix_key_type, onboarding_status",
            )
            .eq("business_id", input.businessId)
            .maybeSingle();

          if (
            !account ||
            account.provider !== "asaas" ||
            !account.sales_enabled ||
            account.onboarding_status !== "active" ||
            !account.wallet_id ||
            !account.subaccount_api_key ||
            !account.pix_key
          ) {
            return privateNoStoreJson(
              { error: "Conta Asaas ou Chave Pix não configurada para saque." },
              { status: 400 },
            );
          }

          const valueReais = input.amountCents / 100;

          // Valida saldo transferível no Asaas
          const balance = await getAsaasBalance(account.subaccount_api_key);
          if ((balance.transferableBalance ?? balance.balance) < valueReais) {
            return privateNoStoreJson(
              { error: "Saldo disponível insuficiente para realizar esta transferência." },
              { status: 422 },
            );
          }

          // Executa a transferência via PIX no Asaas
          const transfer = await createAsaasTransfer(
            {
              value: valueReais,
              pixAddressKey: account.pix_key,
              pixAddressKeyType: pixKeyTypeSchema.parse(account.pix_key_type || "CPF"),
              description: `Saque ELLO - ${business.name}`,
            },
            account.subaccount_api_key,
          );

          // Registra a retirada no banco
          const idempotencyKey = `withdraw-${Date.now()}-${input.businessId.slice(0, 8)}`;
          await supabase.from("localhub_wallet_withdrawals").insert({
            business_id: input.businessId,
            idempotency_key: idempotencyKey,
            provider_transfer_id: transfer.id,
            amount_cents: input.amountCents,
            status: transfer.status === "FAILED" ? "failed" : "processing",
          });

          // Registra no extrato da carteira
          await supabase.from("localhub_wallet_transactions").insert({
            business_id: input.businessId,
            provider_transaction_id: transfer.id,
            transaction_type: "withdrawal",
            status: transfer.status === "FAILED" ? "failed" : "completed",
            amount_cents: -input.amountCents,
            description: `Saque Pix para chave ${account.pix_key}`,
          });

          return privateNoStoreJson({
            success: true,
            transferId: transfer.id,
            status: transfer.status,
            receiptUrl: transfer.transactionReceiptUrl,
          });
        } catch (error) {
          console.error("Asaas transfer failed:", error);
          return privateNoStoreJson(
            {
              error: error instanceof Error ? error.message : "Não foi possível concluir o saque.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
