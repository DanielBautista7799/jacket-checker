import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL in .env");
if (!supabaseAnonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY in .env");

const storageKey = "jacket-check-auth";
const existingClient = globalThis.__jacketCheckSupabaseClient;

export const supabase = existingClient || createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey,
  },
  global: {
    headers: {
      "x-application-name": "jacket-checker",
    },
  },
});

if (!existingClient) globalThis.__jacketCheckSupabaseClient = supabase;
