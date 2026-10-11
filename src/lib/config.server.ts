import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl:
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://fahrhrcxzcnnrhjavrfk.supabase.co",
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      "sb_publishable_2wUjef5P5H6bPLqRhfouWw_AFp-Mbk_",
    foodOrderIngestionToken: process.env.FOOD_ORDER_INGESTION_TOKEN,
  };
}

export function getAsaasServerConfig() {
  return {
    apiKey: process.env.ASAAS_API_KEY?.trim(),
    apiBaseUrl: process.env.ASAAS_API_BASE_URL?.trim() || "https://sandbox.asaas.com/api/v3",
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN?.trim(),
  };
}

export function getStripeServerConfig() {
  const stripeMode = process.env.STRIPE_MODE ?? "test";
  return {
    stripeMode,
    secretKey: process.env.STRIPE_SECRET_KEY,
    connectWebhookSecret:
      stripeMode === "live"
        ? process.env.STRIPE_LIVE_CONNECT_WEBHOOK_SECRET
        : process.env.STRIPE_TEST_CONNECT_WEBHOOK_SECRET,
    appBaseUrl:
      process.env.APP_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === "production"
          ? "https://ello.app.br"
          : "http://localhost:3000"),
  };
}

export function getWhatsAppServerConfig() {
  return {
    provider: (process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() || "evolution") as
      | "evolution"
      | "zapi"
      | "meta"
      | "webhook"
      | "none",
    apiUrl:
      process.env.WHATSAPP_API_URL?.trim() ||
      "https://evolution-api-production-072e.up.railway.app",
    apiToken:
      process.env.WHATSAPP_API_TOKEN?.trim() ||
      "c5e2d29a4145bac85fcb745872619307b137810ae9e39a733b20a8a6800768c8",
    instanceId: process.env.WHATSAPP_INSTANCE_ID?.trim() || "ello-principal",
    notifyOwner: process.env.WHATSAPP_NOTIFY_OWNER !== "false",
  };
}
