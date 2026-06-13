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
    // Default fallback values from .env.example
    const defaultUrl = "https://lzmzxxcwwqzgzxyiwpxj.supabase.co";
    const defaultAnonKey = "sb_publishable_yZlwNv6cE1PAyoz3JThbZg_ZP5oaDDF";

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

    if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
      console.warn("Supabase credentials invalid. Using a placeholder client.");
      _supabase = createClient(
        isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder.supabase.co",
        supabaseAnonKey || "placeholder"
      );
    } else {
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return _supabase;
}

export const supabase = getSupabase();
