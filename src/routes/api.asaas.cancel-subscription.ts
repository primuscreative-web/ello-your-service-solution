import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  cancelAsaasSubscription,
  getAsaasAdminSupabase,
  isAsaasConfigured,
} from "@/lib/asaas.server";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security.server";

export const Route = createFileRoute("/api/asaas/cancel-subscription")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const limit = checkRateLimit(`cancel-plan:${getClientIp(request)}`, 5, 60_000);
        if (!limit.allowed) return createRateLimitResponse(limit.resetSeconds);
        if (!isAsaasConfigured())
          return Response.json(
            { error: "O serviço de pagamentos não está disponível." },
            { status: 503 },
          );

        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer "))
          return Response.json(
            { error: "Entre na sua conta para cancelar o plano." },
            { status: 401 },
          );

        const supabase = getAsaasAdminSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser(bearer.slice(7));
        if (authError || !authData.user)
          return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

        const body = await request.json().catch(() => null);
        if (!z.object({ confirmation: z.literal("CANCELAR") }).safeParse(body).success) {
          return Response.json({ error: "Confirme o cancelamento do plano." }, { status: 400 });
        }

        const { data: business, error: businessError } = await supabase
          .from("localhub_businesses")
          .select("id")
          .eq("owner_id", authData.user.id)
          .maybeSingle();
        if (businessError || !business)
          return Response.json({ error: "Não encontramos seu negócio." }, { status: 404 });

        const { data: state, error } = await supabase
          .from("localhub_plan_subscriptions")
          .select("asaas_subscription_id, status, plan")
          .eq("business_id", business.id)
          .maybeSingle();
        if (error || !state)
          return Response.json({ error: "Não há um plano pago para cancelar." }, { status: 404 });

        try {
          if (state.asaas_subscription_id)
            await cancelAsaasSubscription(state.asaas_subscription_id);
          const { error: paymentsUpdateError } = await supabase
            .from("localhub_asaas_plan_payments")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("business_id", business.id)
            .in("status", ["pending", "overdue"]);
          if (paymentsUpdateError) throw paymentsUpdateError;
          const { error: updateError } = await supabase
            .from("localhub_plan_subscriptions")
            .update({
              asaas_subscription_id: null,
              status: "free",
              plan: "free",
              billing_cycle: null,
              pending_plan: null,
              pending_billing_cycle: null,
              pending_payment_id: null,
              pending_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("business_id", business.id);
          if (updateError) throw updateError;

          const { data: businessRow } = await supabase
            .from("localhub_businesses")
            .select("onboarding_details")
            .eq("id", business.id)
            .maybeSingle();
          if (businessRow) {
            await supabase
              .from("localhub_businesses")
              .update({
                onboarding_details: { ...(businessRow.onboarding_details ?? {}), plan: "free" },
              })
              .eq("id", business.id);
          }
          return Response.json({ success: true, plan: "free" });
        } catch (caught) {
          console.error("Falha ao cancelar assinatura ELLO.", caught);
          const message =
            caught instanceof Error ? caught.message : "Não foi possível confirmar o cancelamento.";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
