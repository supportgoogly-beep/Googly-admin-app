import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
      console.warn("Supabase credentials missing or invalid. Check environment variables.");
      // Fallback to placeholder if not configured to prevent crashes, but warn the user
      _supabase = createClient(isValidUrl(supabaseUrl) ? supabaseUrl : "http://localhost:54321", supabaseAnonKey || "placeholder", { auth: { flowType: 'pkce', persistSession: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined } });
    } else {
      _supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { flowType: 'pkce', persistSession: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined } });
    }
  }
  return _supabase;
}

export const supabase = getSupabase();
