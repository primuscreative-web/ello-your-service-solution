import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAsaasSubaccount,
  getAsaasAdminSupabase,
  getAsaasBalance,
  isAsaasConfigured,
} from "@/lib/asaas.server";

const subaccountInputSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(2, "Nome ou Razão Social é obrigatório."),
  email: z.string().email("E-mail inválido."),
  cpfCnpj: z.string().min(11, "CPF ou CNPJ inválido."),
  phone: z.string().min(10, "Telefone inválido."),
  postalCode: z.string().min(8, "CEP inválido."),
  address: z.string().min(2, "Endereço é obrigatório."),
  addressNumber: z.string().min(1, "Número é obrigatório."),
  complement: z.string().optional(),
  province: z.string().min(2, "Bairro é obrigatório."),
  city: z.string().optional(),
  state: z.string().optional(),
  pixKey: z.string().min(3, "Chave Pix para saque é obrigatória."),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]),
});

export const Route = createFileRoute("/api/asaas/subaccount")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const businessId = url.searchParams.get("businessId");
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

        if (!token || !businessId) {
          return Response.json({ error: "Parâmetros insuficientes." }, { status: 400 });
        }

        try {
          const supabase = getAsaasAdminSupabase();
          const { data: auth, error: authError } = await supabase.auth.getUser(token);
          if (authError || !auth.user) {
            return Response.json({ error: "Sessão inválida." }, { status: 401 });
          }

          const { data: business } = await supabase
            .from("localhub_businesses")
            .select("id, owner_id")
            .eq("id", businessId)
            .eq("owner_id", auth.user.id)
            .maybeSingle();

          if (!business) {
            return Response.json({ error: "Negócio não encontrado." }, { status: 404 });
          }

          const { data: paymentAccount } = await supabase
            .from("localhub_payment_accounts")
            .select(
              "sales_enabled, onboarding_status, provider_account_id, wallet_id, subaccount_api_key, account_number, agency, pix_key, pix_key_type, legal_name, cpf_cnpj, email, phone",
            )
            .eq("business_id", businessId)
            .maybeSingle();

          let balance = { balance: 0, totalPending: 0, transferableBalance: 0 };
          if (paymentAccount?.subaccount_api_key && isAsaasConfigured()) {
            try {
              balance = await getAsaasBalance(paymentAccount.subaccount_api_key);
            } catch (err) {
              console.warn("Não foi possível obter saldo Asaas da subconta:", err);
            }
          }

          return Response.json({
            success: true,
            account: {
              salesEnabled: paymentAccount?.sales_enabled ?? false,
              onboardingStatus: paymentAccount?.onboarding_status ?? "not_started",
              providerAccountId: paymentAccount?.provider_account_id,
              walletId: paymentAccount?.wallet_id,
              accountNumber: paymentAccount?.account_number,
              agency: paymentAccount?.agency,
              pixKey: paymentAccount?.pix_key,
              pixKeyType: paymentAccount?.pix_key_type,
              legalName: paymentAccount?.legal_name,
              cpfCnpj: paymentAccount?.cpf_cnpj,
              email: paymentAccount?.email,
              phone: paymentAccount?.phone,
            },
            balance,
          });
        } catch (error) {
          console.error("Asaas subaccount GET error:", error);
          return Response.json({ error: "Erro ao consultar subconta." }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return Response.json({ error: "Autenticação necessária." }, { status: 401 });
        }

        let input: z.infer<typeof subaccountInputSchema>;
        try {
          input = subaccountInputSchema.parse(await request.json());
        } catch (err) {
          return Response.json(
            { error: "Dados inválidos para abertura de subconta.", details: err },
            { status: 400 },
          );
        }

        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "O gateway Asaas mestre não está configurado no servidor (ASAAS_API_KEY)." },
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
            return Response.json({ error: "Negócio não encontrado ou não autorizado." }, { status: 404 });
          }

          // Cria subconta no Asaas
          const subaccount = await createAsaasSubaccount({
            name: input.name,
            email: input.email,
            cpfCnpj: input.cpfCnpj,
            phone: input.phone,
            postalCode: input.postalCode,
            address: input.address,
            addressNumber: input.addressNumber,
            complement: input.complement,
            province: input.province,
          });

          // Grava a subconta no banco
          await supabase.from("localhub_payment_accounts").upsert({
            business_id: input.businessId,
            provider: "asaas",
            sales_enabled: true,
            onboarding_status: "active",
            provider_account_id: subaccount.id,
            wallet_id: subaccount.walletId,
            subaccount_api_key: subaccount.apiKey ?? null,
            account_number: subaccount.accountNumber?.account ?? null,
            agency: subaccount.accountNumber?.agency ?? null,
            pix_key: input.pixKey,
            pix_key_type: input.pixKeyType,
            legal_name: input.name,
            cpf_cnpj: input.cpfCnpj,
            email: input.email,
            phone: input.phone,
            postal_code: input.postalCode,
            address: input.address,
            address_number: input.addressNumber,
            complement: input.complement ?? null,
            province: input.province,
            city: input.city ?? null,
            state: input.state ?? null,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Atualiza também flag do negócio se necessário
          await supabase
            .from("localhub_businesses")
            .update({ online_payment_enabled: true })
            .eq("id", input.businessId);

          return Response.json({
            success: true,
            accountId: subaccount.id,
            walletId: subaccount.walletId,
          });
        } catch (error) {
          console.error("Asaas subaccount creation failed:", error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Falha ao criar subconta no Asaas. Confira os dados informados.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
