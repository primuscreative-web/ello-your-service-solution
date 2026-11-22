import type { PlanSubscriptionState } from "@/lib/localhub-context";

export type PlanId = "free" | "pro" | "business";
export type PaidFeature =
  | "team"
  | "crm"
  | "white_label"
  | "video_portfolio"
  | "self_service_kiosk"
  | "whatsapp_automation"
  | "delivery_management"
  | "multi_unit";

// Keep these display limits in sync with the server-enforced values in
// Supabase migrations. Booking availability is intentionally free on every tier.
export const PLAN_LIMITS: Record<
  PlanId,
  {
    catalogItems: number | null;
    portfolioVideos: number | null;
    newCustomersPerMonth: number | null;
  }
> = {
  free: { catalogItems: 10, portfolioVideos: 0, newCustomersPerMonth: 50 },
  pro: { catalogItems: null, portfolioVideos: 20, newCustomersPerMonth: 500 },
  business: { catalogItems: null, portfolioVideos: null, newCustomersPerMonth: null },
};

const PLAN_FEATURES: Record<PlanId, readonly PaidFeature[]> = {
  free: [],
  pro: ["team", "crm", "white_label", "video_portfolio"],
  business: [
    "team",
    "crm",
    "white_label",
    "video_portfolio",
    "self_service_kiosk",
    "whatsapp_automation",
    "delivery_management",
    "multi_unit",
  ],
};

export function getEffectivePlan(subscription: PlanSubscriptionState | null | undefined): PlanId {
  if (subscription?.status !== "active") return "free";
  return subscription.plan === "pro" || subscription.plan === "business"
    ? subscription.plan
    : "free";
}

export function hasPlanFeature(
  subscription: PlanSubscriptionState | null | undefined,
  feature: PaidFeature,
): boolean {
  return PLAN_FEATURES[getEffectivePlan(subscription)].includes(feature);
}

export function getPlanLimit(
  subscription: PlanSubscriptionState | null | undefined,
  limit: keyof (typeof PLAN_LIMITS)[PlanId],
): number | null {
  return PLAN_LIMITS[getEffectivePlan(subscription)][limit];
}

export function getPlanName(plan: PlanId): string {
  return plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Grátis";
}
