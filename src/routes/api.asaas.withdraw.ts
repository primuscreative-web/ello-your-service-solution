import { createFileRoute } from "@tanstack/react-router";
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

const withdrawInputSchema = z.object({
  businessId: z.string().uuid(),
  amountCents: z
    .number()
    .int()
    .min(500, "O valor mínimo para transferência é de R$ 5,00.")
    .max(5_000_000, "O valor máximo por transferência é de R$ 50.000,00."),
});

export const Route = createFileRoute("/api/asaas/withdraw")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Rate Limiting por IP (Máx 5 req/min)
        const ip = getClientIp(request);
        const ipLimit = checkRateLimit(`withdraw-ip:${ip}`, 5, 60_000);
        if (!ipLimit.allowed) {
          return createRateLimitResponse(ipLimit.resetSeconds);
        }

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return Response.json({ error: "Autenticação necessária." }, { status: 401 });
        }

        let input: z.infer<typeof withdrawInputSchema>;
        try {
          input = withdrawInputSchema.parse(await request.json());
        } catch (err: any) {
          const msg = err?.errors?.[0]?.message || "Dados inválidos para saque.";
          return Response.json({ error: msg }, { status: 400 });
        }

        // 2. Rate Limiting por Negócio (Máx 3 saques por 5 minutos para evitar esvaziamento concorrente)
        const bizLimit = checkRateLimit(`withdraw-biz:${input.businessId}`, 3, 300_000);
        if (!bizLimit.allowed) {
          return Response.json(
            { error: "Limite de solicitações de saque atingido para este período. Aguarde 5 minutos." },
            { status: 429 },
          );
        }

        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "Gateway Asaas não configurado no servidor." },
            { status: 503 },
          );
        }

        try {
          const supabase = getAsaasAdminSupabase();
          const { data: auth, error: authError } = await supabase.auth.getUser(token);
          if (authError || !auth.user) {
            return Response.json({ error: "Sessão inválida." }, { status: 401 });
          }

          const { data: business } = await supabase
            .from("localhub_businesses")
            .select("id, owner_id, name")
            .eq("id", input.businessId)
            .eq("owner_id", auth.user.id)
            .maybeSingle();

          if (!business) {
            return Response.json({ error: "Negócio não encontrado ou acesso não autorizado." }, { status: 404 });
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
            return Response.json(
              { error: "Já existe uma transferência em processamento para este negócio. Aguarde a confirmação." },
              { status: 409 },
            );
          }

          const { data: account } = await supabase
            .from("localhub_payment_accounts")
            .select("subaccount_api_key, pix_key, pix_key_type, onboarding_status")
            .eq("business_id", input.businessId)
            .maybeSingle();

          if (!account || !account.subaccount_api_key || !account.pix_key) {
            return Response.json(
              { error: "Conta Asaas ou Chave Pix não configurada para saque." },
              { status: 400 },
            );
          }

          const valueReais = input.amountCents / 100;

          // Valida saldo transferível no Asaas
          const balance = await getAsaasBalance(account.subaccount_api_key);
          if ((balance.transferableBalance ?? balance.balance) < valueReais) {
            return Response.json(
              { error: "Saldo disponível insuficiente para realizar esta transferência." },
              { status: 422 },
            );
          }

          // Executa a transferência via PIX no Asaas
          const transfer = await createAsaasTransfer(
            {
              value: valueReais,
              pixAddressKey: account.pix_key,
              pixAddressKeyType: (account.pix_key_type as any) || "CPF",
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

          return Response.json({
            success: true,
            transferId: transfer.id,
            status: transfer.status,
            receiptUrl: transfer.transactionReceiptUrl,
          });
        } catch (error) {
          console.error("Asaas transfer failed:", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Não foi possível concluir o saque.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
