import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __ELLO_CONFIG__?: {
      supabaseAnonKey?: string;
      supabaseUrl?: string;
    };
  }
}

const runtimeConfig = typeof window !== "undefined" ? window.__ELLO_CONFIG__ : undefined;
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || runtimeConfig?.supabaseUrl;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || runtimeConfig?.supabaseAnonKey;

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;

  browserClient ??= createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}
