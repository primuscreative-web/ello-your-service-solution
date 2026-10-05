import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAsaasTransfer,
  getAsaasAdminSupabase,
  getAsaasBalance,
  isAsaasConfigured,
} from "@/lib/asaas.server";

const withdrawInputSchema = z.object({
  businessId: z.string().uuid(),
  amountCents: z.number().int().positive("Valor deve ser maior que zero."),
});

export const Route = createFileRoute("/api/asaas/withdraw")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return Response.json({ error: "Autenticação necessária." }, { status: 401 });
        }

        let input: z.infer<typeof withdrawInputSchema>;
        try {
          input = withdrawInputSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Dados inválidos para saque." }, { status: 400 });
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
            return Response.json({ error: "Negócio não encontrado." }, { status: 404 });
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
