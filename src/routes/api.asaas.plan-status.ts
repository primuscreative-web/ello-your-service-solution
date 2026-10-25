import { createFileRoute } from "@tanstack/react-router";
import { getAsaasAdminSupabase } from "@/lib/asaas.server";

export const Route = createFileRoute("/api/asaas/plan-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer "))
          return Response.json({ error: "Não autenticado." }, { status: 401 });
        const supabase = getAsaasAdminSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser(bearer.slice(7));
        if (authError || !authData.user)
          return Response.json({ error: "Sessão inválida." }, { status: 401 });
        const { data: business } = await supabase
          .from("localhub_businesses")
          .select("id")
          .eq("owner_id", authData.user.id)
          .maybeSingle();
        if (!business) return Response.json({ plan: "free", status: "free" });
        const { data: state, error } = await supabase
          .from("localhub_plan_subscriptions")
          .select("plan, billing_cycle, status, pending_plan, pending_billing_cycle")
          .eq("business_id", business.id)
          .maybeSingle();
        if (error)
          return Response.json({ error: "Não foi possível consultar o plano." }, { status: 503 });
        return Response.json(state ?? { plan: "free", status: "free" });
      },
    },
  },
});
