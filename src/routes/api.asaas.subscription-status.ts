import { createFileRoute } from "@tanstack/react-router";
import { privateNoStoreJson } from "@/lib/security.server";
import { asaasFetch, getAsaasAdminSupabase, isAsaasConfigured } from "@/lib/asaas.server";

export const Route = createFileRoute("/api/asaas/subscription-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAsaasConfigured())
          return privateNoStoreJson(
            { error: "O serviço de pagamentos não está disponível." },
            { status: 503 },
          );
        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer "))
          return privateNoStoreJson({ error: "Não autenticado." }, { status: 401 });
        const supabase = getAsaasAdminSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser(bearer.slice(7));
        if (authError || !authData.user)
          return privateNoStoreJson({ error: "Sessão inválida." }, { status: 401 });

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("paymentId");

        if (!paymentId) {
          return privateNoStoreJson(
            { error: "Parâmetro paymentId é obrigatório." },
            { status: 400 },
          );
        }

        try {
          // Consulta o status real do pagamento diretamente no Asaas
          const payment = await asaasFetch<{
            id: string;
            status: string;
            value: number;
            subscription?: string;
            paymentDate?: string;
            confirmedDate?: string;
            clientPaymentDate?: string;
          }>(`payments/${paymentId}`);

          const isPaid = payment.status === "RECEIVED" || payment.status === "CONFIRMED";

          const { data: ownedBusiness } = await supabase
            .from("localhub_businesses")
            .select("id")
            .eq("owner_id", authData.user.id)
            .maybeSingle();
          if (!ownedBusiness)
            return privateNoStoreJson({ error: "Negócio não encontrado." }, { status: 404 });
          const { data: planPayment } = await supabase
            .from("localhub_asaas_plan_payments")
            .select("business_id, asaas_subscription_id, status")
            .eq("asaas_payment_id", paymentId)
            .eq("business_id", ownedBusiness.id)
            .maybeSingle();
          if (
            !planPayment ||
            (payment.subscription && payment.subscription !== planPayment.asaas_subscription_id)
          ) {
            return privateNoStoreJson(
              { error: "Cobrança não vinculada à sua conta." },
              { status: 404 },
            );
          }

          return privateNoStoreJson({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            isPaid: isPaid && ["confirmed", "received"].includes(planPayment.status),
            value: payment.value,
            paymentDate: payment.paymentDate || payment.confirmedDate || payment.clientPaymentDate,
          });
        } catch (err: unknown) {
          console.error("Erro ao consultar status do pagamento Asaas:", err);
          const message = err instanceof Error ? err.message : "Erro ao consultar status no Asaas.";
          return privateNoStoreJson({ error: message }, { status: 500 });
        }
      },
    },
  },
});
