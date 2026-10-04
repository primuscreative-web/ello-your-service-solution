import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/c/$businessSlug/$campaignSlug")({
  component: FoodCampaignRedirect,
});

function FoodCampaignRedirect() {
  const { businessSlug, campaignSlug } = Route.useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Não foi possível abrir esta campanha.");
      return;
    }

    void client
      .rpc("localhub_open_food_campaign", {
        p_business_slug: businessSlug,
        p_campaign_slug: campaignSlug,
      })
      .then(
        ({ data, error: openError }) => {
          if (!active) return;
          const result = Array.isArray(data) ? data[0] : data;
          if (openError || !result?.target_path?.startsWith("/loja/")) {
            setError(openError?.message ?? "Este link de campanha não está disponível.");
            return;
          }
          window.location.replace(result.target_path);
        },
        () => {
          if (active) setError("Não foi possível abrir esta campanha. Tente novamente.");
        },
      );

    return () => {
      active = false;
    };
  }, [businessSlug, campaignSlug]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f7f4] px-5 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#292b25] text-xl font-bold text-[#d0f25a]">
          e
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          {error || "Abrindo sua campanha…"}
        </p>
      </div>
    </main>
  );
}
