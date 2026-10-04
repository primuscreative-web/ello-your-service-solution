import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getStripeAdminClient, getStripeBaseUrl, getStripeClient } from "@/lib/stripe.server";

const inputSchema = z.object({ businessId: z.string().uuid() });

export const Route = createFileRoute("/api/stripe/connect/onboarding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Autenticação necessária." }, { status: 401 });
        let input: z.infer<typeof inputSchema>;
        try {
          input = inputSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Negócio inválido." }, { status: 400 });
        }

        try {
          const supabase = getStripeAdminClient();
          const { data: auth, error: authError } = await supabase.auth.getUser(token);
          if (authError || !auth.user) {
            return Response.json({ error: "Sessão inválida." }, { status: 401 });
          }
          const { data: business, error: businessError } = await supabase
            .from("localhub_businesses")
            .select("id, owner_id, name, slug")
            .eq("id", input.businessId)
            .eq("owner_id", auth.user.id)
            .maybeSingle();
          if (businessError || !business) {
            return Response.json({ error: "Negócio não encontrado." }, { status: 404 });
          }

          const stripe = getStripeClient();
          const { data: storedAccount } = await supabase
            .from("localhub_stripe_connect_accounts")
            .select("stripe_account_id")
            .eq("business_id", business.id)
            .maybeSingle();
          const account = storedAccount?.stripe_account_id
            ? await stripe.accounts.retrieve(storedAccount.stripe_account_id)
            : await stripe.accounts.create(
                {
                  type: "express",
                  country: "BR",
                  email: auth.user.email,
                  capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                  },
                  business_profile: { name: business.name },
                  metadata: { ello_business_id: business.id },
                },
                { idempotencyKey: `ello-connect-account-${business.id}` },
              );

          const { error: saveError } = await supabase
            .from("localhub_stripe_connect_accounts")
            .upsert({
              business_id: business.id,
              stripe_account_id: account.id,
              charges_enabled: account.charges_enabled,
              payouts_enabled: account.payouts_enabled,
              details_submitted: account.details_submitted,
              updated_at: new Date().toISOString(),
            });
          if (saveError) throw saveError;

          const baseUrl = getStripeBaseUrl();
          const link = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${baseUrl}/studio/financeiro?stripe=refresh`,
            return_url: `${baseUrl}/studio/financeiro?stripe=return`,
            type: "account_onboarding",
          });
          return Response.json({ url: link.url });
        } catch (error) {
          console.error(
            "Stripe Connect onboarding unavailable",
            error instanceof Error ? error.message : "unknown",
          );
          return Response.json({ error: "Configuração Stripe indisponível." }, { status: 503 });
        }
      },
    },
  },
});
