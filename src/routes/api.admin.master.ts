import { createFileRoute } from "@tanstack/react-router";
import { privateNoStoreJson, getSecurityAdminSupabase } from "@/lib/security.server";
import { BR_PLAN_PRICES } from "@/lib/market-pricing";

const MASTER_EMAILS = ["master@ello.app.br", "admin@ello.app.br", "primuscreative@gmail.com"];

function isMasterUser(
  user: { email?: string | null; app_metadata?: Record<string, unknown> | null } | null,
): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  if (MASTER_EMAILS.includes(email)) return true;
  if (user.app_metadata?.role === "master" || user.app_metadata?.is_master === true) return true;
  return false;
}

export const Route = createFileRoute("/api/admin/master")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer ")) {
          return privateNoStoreJson({ error: "Não autenticado." }, { status: 401 });
        }

        const supabase = getSecurityAdminSupabase();
        const token = bearer.slice(7).trim();
        const { data: authData, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authData.user) {
          return privateNoStoreJson({ error: "Sessão inválida ou expirada." }, { status: 401 });
        }

        if (!isMasterUser(authData.user)) {
          return privateNoStoreJson(
            {
              error: "Acesso restrito. Esta conta não possui privilégios de Administrador Mestre.",
            },
            { status: 403 },
          );
        }

        try {
          // 1. Fetch all users from Supabase Auth
          const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          const allUsers = usersData?.users || [];

          // 2. Fetch all businesses
          const { data: businesses, error: bizErr } = await supabase
            .from("localhub_businesses")
            .select("*")
            .order("created_at", { ascending: false });

          // 3. Fetch all subscriptions
          const { data: subscriptions } = await supabase
            .from("localhub_plan_subscriptions")
            .select("*");

          // 4. Fetch all services
          const { data: services } = await supabase
            .from("localhub_services")
            .select("id, business_id, name, price, is_active");

          // 5. Fetch all orders
          const { data: orders } = await supabase
            .from("localhub_orders")
            .select("*")
            .order("created_at", { ascending: false });

          // 6. Fetch all bookings
          const { data: bookings } = await supabase
            .from("localhub_bookings")
            .select("*")
            .order("created_at", { ascending: false });

          // Build User Lookup Map
          const userMap = new Map<
            string,
            { email: string; name: string; created_at: string; last_sign_in_at: string | null }
          >();
          for (const u of allUsers) {
            userMap.set(u.id, {
              email: u.email || "Sem e-mail",
              name:
                (u.user_metadata?.full_name as string) ||
                (u.user_metadata?.name as string) ||
                u.email?.split("@")[0] ||
                "Usuário",
              created_at: u.created_at,
              last_sign_in_at: u.last_sign_in_at || null,
            });
          }

          // Build Subscriptions Map
          const subMap = new Map<string, { plan: string; billing_cycle: string; status: string }>();
          for (const s of subscriptions || []) {
            subMap.set(s.business_id, {
              plan: s.plan || "free",
              billing_cycle: s.billing_cycle || "monthly",
              status: s.status || "active",
            });
          }

          // Aggregate per-business metrics
          const bizList = (businesses || []).map((b) => {
            const owner = userMap.get(b.owner_id);
            const sub = subMap.get(b.id) || {
              plan: "free",
              billing_cycle: "monthly",
              status: "free",
            };
            const bServices = (services || []).filter((s) => s.business_id === b.id);
            const bOrders = (orders || []).filter((o) => o.business_id === b.id);
            const bBookings = (bookings || []).filter((bk) => bk.business_id === b.id);

            const ordersValue = bOrders.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              category: b.category,
              city: b.city || "Não informada",
              phone: b.phone || "Não informado",
              is_published: Boolean(b.is_published),
              created_at: b.created_at,
              owner_id: b.owner_id,
              owner_email: owner?.email || "Sem e-mail",
              owner_name: owner?.name || "Lojista",
              owner_last_sign_in: owner?.last_sign_in_at || null,
              plan: sub.plan,
              billing_cycle: sub.billing_cycle,
              subscription_status: sub.status,
              services_count: bServices.length,
              orders_count: bOrders.length,
              orders_total_value: ordersValue,
              bookings_count: bBookings.length,
              pix_configured: Boolean(b.pix_key),
              whatsapp_connected: Boolean(b.whatsapp_instance_id),
            };
          });

          // Global Metrics
          const totalUsers = allUsers.length;
          const totalBusinesses = bizList.length;
          const publishedBusinesses = bizList.filter((b) => b.is_published).length;
          const totalOrders = orders?.length || 0;
          const totalOrdersGmv = (orders || []).reduce((acc, o) => acc + Number(o.total || 0), 0);
          const totalBookings = bookings?.length || 0;

          // Plans Distribution & MRR
          let mrr = 0;
          const planCounts = { free: 0, pro: 0, business: 0 };
          for (const b of bizList) {
            if (b.subscription_status === "active" && (b.plan === "pro" || b.plan === "business")) {
              if (b.plan === "pro") {
                planCounts.pro++;
                mrr += BR_PLAN_PRICES.pro.monthly / 100;
              } else if (b.plan === "business") {
                planCounts.business++;
                mrr += BR_PLAN_PRICES.business.monthly / 100;
              }
            } else {
              planCounts.free++;
            }
          }

          // Conversion Funnel
          const funnel = {
            step1_signups: totalUsers,
            step2_created_biz: totalBusinesses,
            step3_added_services: bizList.filter((b) => b.services_count > 0).length,
            step4_published: publishedBusinesses,
            step5_active_transactions: bizList.filter(
              (b) => b.orders_count > 0 || b.bookings_count > 0,
            ).length,
          };

          // Recent Flows
          const recentOrders = (orders || []).slice(0, 10).map((o) => {
            const biz = bizList.find((b) => b.id === o.business_id);
            return {
              id: o.id,
              order_number: o.order_number,
              customer_name: o.customer_name,
              total: Number(o.total || 0),
              status: o.status,
              fulfillment: o.fulfillment,
              created_at: o.created_at,
              business_name: biz?.name || "Estabelecimento",
              business_slug: biz?.slug || "",
            };
          });

          const recentBookings = (bookings || []).slice(0, 10).map((bk) => {
            const biz = bizList.find((b) => b.id === bk.business_id);
            const srv = (services || []).find((s) => s.id === bk.service_id);
            return {
              id: bk.id,
              customer_name: bk.customer_name,
              booking_date: bk.booking_date,
              booking_time: bk.booking_time,
              status: bk.status,
              service_name: srv?.name || "Serviço",
              price: srv?.price || 0,
              business_name: biz?.name || "Estabelecimento",
              business_slug: biz?.slug || "",
            };
          });

          return privateNoStoreJson({
            metrics: {
              totalUsers,
              totalBusinesses,
              publishedBusinesses,
              draftBusinesses: totalBusinesses - publishedBusinesses,
              totalOrders,
              totalOrdersGmv,
              totalBookings,
              mrr,
              planCounts,
            },
            funnel,
            businesses: bizList,
            recentOrders,
            recentBookings,
            masterUser: {
              email: authData.user.email,
              id: authData.user.id,
            },
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Erro desconhecido ao carregar dados mestre.";
          console.error("Master API error:", message);
          return privateNoStoreJson({ error: message }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer ")) {
          return privateNoStoreJson({ error: "Não autenticado." }, { status: 401 });
        }

        const supabase = getSecurityAdminSupabase();
        const token = bearer.slice(7).trim();
        const { data: authData, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authData.user || !isMasterUser(authData.user)) {
          return privateNoStoreJson(
            { error: "Acesso restrito ao Administrador Mestre." },
            { status: 403 },
          );
        }

        const body = await request.json().catch(() => null);
        if (!body || !body.action) {
          return privateNoStoreJson({ error: "Ação não informada." }, { status: 400 });
        }

        // Action 1: Alterar Plano de um Negócio Manualmente
        if (body.action === "update_business_plan") {
          const { businessId, plan, billingCycle = "monthly" } = body;
          if (!businessId || !["free", "pro", "business"].includes(plan)) {
            return privateNoStoreJson({ error: "Parâmetros inválidos." }, { status: 400 });
          }

          const { error: upsertErr } = await supabase.from("localhub_plan_subscriptions").upsert({
            business_id: businessId,
            plan,
            billing_cycle: billingCycle,
            status: plan === "free" ? "free" : "active",
            updated_at: new Date().toISOString(),
          });

          if (upsertErr) {
            return privateNoStoreJson({ error: upsertErr.message }, { status: 500 });
          }

          return privateNoStoreJson({
            success: true,
            message: `Plano atualizado para ${plan.toUpperCase()}.`,
          });
        }

        // Action 2: Alternar Publicação da Loja
        if (body.action === "toggle_publish") {
          const { businessId, isPublished } = body;
          if (!businessId || typeof isPublished !== "boolean") {
            return privateNoStoreJson({ error: "Parâmetros inválidos." }, { status: 400 });
          }

          const { error: updErr } = await supabase
            .from("localhub_businesses")
            .update({ is_published: isPublished })
            .eq("id", businessId);

          if (updErr) {
            return privateNoStoreJson({ error: updErr.message }, { status: 500 });
          }

          return privateNoStoreJson({
            success: true,
            message: isPublished
              ? "Negócio publicado com sucesso."
              : "Negócio movido para rascunho.",
          });
        }

        return privateNoStoreJson({ error: "Ação desconhecida." }, { status: 400 });
      },
    },
  },
});
