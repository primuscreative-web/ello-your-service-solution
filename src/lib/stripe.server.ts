import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getServerConfig, getStripeServerConfig } from "@/lib/config.server";

export function getStripeClient() {
  const { secretKey, stripeMode } = getStripeServerConfig();
  if (stripeMode !== "test" && stripeMode !== "live") {
    throw new Error("STRIPE_MODE precisa ser test ou live.");
  }
  if (process.env.VERCEL_ENV === "production" && stripeMode !== "live") {
    throw new Error("O ambiente Production exige Stripe live.");
  }
  if (process.env.VERCEL_ENV !== "production" && stripeMode === "live") {
    throw new Error("Stripe live só pode ser usado no ambiente Production.");
  }
  const validPrefix = stripeMode === "live" ? /^(sk|rk)_live_/ : /^(sk|rk)_test_/;
  if (!secretKey || !validPrefix.test(secretKey)) {
    throw new Error(`Configure uma chave Stripe ${stripeMode} no servidor.`);
  }
  return new Stripe(secretKey);
}

export function getStripeAdminClient() {
  const config = getServerConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Banco de dados não configurado para a integração Stripe.");
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getStripeBaseUrl() {
  const baseUrl = getStripeServerConfig().appBaseUrl;
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("APP_BASE_URL precisa usar HTTPS.");
  }
  return parsed.origin;
}
