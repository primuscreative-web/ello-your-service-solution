import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type PaidFeature, type PlanId } from "@/lib/plan-access";
import type { PlanSubscriptionState } from "@/lib/localhub-context";

export async function businessHasPlanFeature(
  supabase: SupabaseClient,
  businessId: string,
  feature: PaidFeature,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("localhub_plan_subscriptions")
    .select("plan,status")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw new Error("Could not verify business plan access.");
  return hasPlanFeature(
    data as { plan: PlanId; status: PlanSubscriptionState["status"] } | null,
    feature,
  );
}
