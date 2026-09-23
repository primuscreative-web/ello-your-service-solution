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
  runtimeConfig?.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey =
  runtimeConfig?.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabasePublicConfig() {
  if (!isSupabaseConfigured()) return null;

  return {
    anonKey: supabaseAnonKey!,
    url: supabaseUrl!,
  };
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
