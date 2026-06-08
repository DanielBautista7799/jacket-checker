import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL in .env");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY in .env");
}

const globalSupabase = globalThis.__supabaseClient;

export const supabase =
  globalSupabase || createClient(supabaseUrl, supabaseAnonKey);

if (!globalSupabase) {
  globalThis.__supabaseClient = supabase;
}