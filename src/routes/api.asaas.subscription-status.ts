import { createFileRoute } from "@tanstack/react-router";
import { asaasFetch, getAsaasAdminSupabase, isAsaasConfigured } from "@/lib/asaas.server";

export const Route = createFileRoute("/api/asaas/subscription-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAsaasConfigured()) {
          return Response.json(
            { error: "O gateway Asaas não está configurado no servidor." },
            { status: 503 },
          );
        }

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("paymentId");
        const businessId = url.searchParams.get("businessId");
        const planId = url.searchParams.get("planId") as "pro" | "business" | null;
        const billingCycle = url.searchParams.get("billingCycle") as "monthly" | "yearly" | null;

        if (!paymentId) {
          return Response.json({ error: "Parâmetro paymentId é obrigatório." }, { status: 400 });
        }

        try {
          // Consulta o status real do pagamento diretamente no Asaas
          const payment = await asaasFetch<{
            id: string;
            status: string;
            value: number;
            paymentDate?: string;
            confirmedDate?: string;
            clientPaymentDate?: string;
          }>(`payments/${paymentId}`);

          const isPaid = payment.status === "RECEIVED" || payment.status === "CONFIRMED";

          // Se estiver pago e tiver businessId, garante a ativação no Supabase
          if (isPaid && businessId && planId) {
            try {
              const supabase = getAsaasAdminSupabase();
              const { data: currentBiz } = await supabase
                .from("localhub_businesses")
                .select("onboarding_details")
                .eq("id", businessId)
                .maybeSingle();

              if (currentBiz) {
                const currentDetails = currentBiz.onboarding_details || {};
                if (currentDetails.plan !== planId) {
                  await supabase
                    .from("localhub_businesses")
                    .update({
                      onboarding_details: {
                        ...currentDetails,
                        plan: planId,
                        planBillingCycle: billingCycle || "monthly",
                        planActivatedAt: new Date().toISOString(),
                        lastPaymentId: paymentId,
                      },
                    })
                    .eq("id", businessId);
                }
              }
            } catch (updateErr) {
              console.error("Erro ao ativar plano no banco Supabase:", updateErr);
            }
          }

          return Response.json({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            isPaid,
            value: payment.value,
            paymentDate: payment.paymentDate || payment.confirmedDate || payment.clientPaymentDate,
          });
        } catch (err: unknown) {
          console.error("Erro ao consultar status do pagamento Asaas:", err);
          const message = err instanceof Error ? err.message : "Erro ao consultar status no Asaas.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
