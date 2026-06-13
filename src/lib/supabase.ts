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
      console.warn("Supabase credentials missing or invalid. Using a dummy client for development.");
      // We return a proxy or a dummy client that warns on use, or just create it with placeholders to avoid crash
      _supabase = createClient(
        isValidUrl(supabaseUrl) ? supabaseUrl! : "https://placeholder.supabase.co",
        supabaseAnonKey || "placeholder"
      );
    } else {
      _supabase = createClient(supabaseUrl!, supabaseAnonKey);
    }
  }
  return _supabase;
}

export const supabase = getSupabase();
