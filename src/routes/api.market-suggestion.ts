import { createFileRoute } from "@tanstack/react-router";
import { privateNoStoreJson } from "@/lib/security.server";
import { getAsaasAdminSupabase } from "@/lib/asaas.server";
import { MARKETS } from "@/lib/market-pricing";

export const Route = createFileRoute("/api/market-suggestion")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const rawHeaderCountry = request.headers.get("x-vercel-ip-country")?.toUpperCase();
        const headerCountry =
          rawHeaderCountry && /^[A-Z]{2}$/.test(rawHeaderCountry) ? rawHeaderCountry : undefined;
        const country = !headerCountry
          ? "BR"
          : (MARKETS.find((market) => market.country === headerCountry)?.country ?? "ZZ");
        const suggestedMarket = MARKETS.find((market) => market.country === country);
        if (country === "ZZ") {
          return privateNoStoreJson({
            country,
            source: "ip-suggestion",
            market: null,
            enabled: false,
          });
        }
        let configuredMarket: {
          country_code: string;
          display_name: string;
          currency_code: string;
          locale: string;
          is_enabled: boolean;
        } | null = null;
        try {
          const { data, error } = await getAsaasAdminSupabase()
            .from("localhub_markets")
            .select("country_code, display_name, currency_code, locale, is_enabled")
            .eq("country_code", country)
            .maybeSingle();
          if (error) throw error;
          configuredMarket = data;
        } catch {
          return privateNoStoreJson(
            { error: "Catálogo de mercados indisponível." },
            { status: 503 },
          );
        }
        return privateNoStoreJson({
          country,
          source: headerCountry ? "ip-suggestion" : "default",
          market: configuredMarket ?? (country === "BR" ? suggestedMarket : null),
          enabled: configuredMarket?.is_enabled ?? country === "BR",
        });
      },
    },
  },
});
