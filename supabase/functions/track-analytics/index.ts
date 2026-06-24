import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const allowedEvents = new Set([
  "guest_page_view", "guest_location_search", "guest_browser_location", "guest_forecast_window_changed",
  "guest_check_started", "guest_check_completed", "guest_check_failed", "personalized_page_view",
  "personalized_location_search", "personalized_browser_location", "personalized_forecast_window_changed",
  "personalized_check_started", "personalized_check_completed", "personalized_check_failed",
  "alternate_jacket_selected", "jacket_created", "jacket_updated", "jacket_archived", "jacket_restored",
  "jacket_deleted", "jacket_image_added", "jacket_primary_image_changed", "jacket_ai_analysis_started",
  "jacket_ai_analysis_completed", "jacket_ai_analysis_failed", "jacket_embedding_completed",
  "jacket_embedding_failed", "duplicate_warning_shown", "similar_jackets_opened",
  "jacket_feedback_submitted", "jacket_feedback_changed", "trend_feedback_submitted", "learning_reset",
  "history_entry_deleted", "weather_cache_hit", "weather_cache_miss", "signed_image_cache_refresh",
  "edge_function_error", "route_error", "unexpected_ui_error", "developer_page_view",
]);

const safeModes = new Set(["guest", "personalized", "developer"]);
const safeKey = /^[a-z][a-z0-9_]{0,47}$/;
const blockedKey = /(?:email|token|secret|password|authorization|cookie|coordinate|latitude|longitude|\blat\b|\blon\b|image|path|url|prompt|response|vector|address|city|location_name|query_text)/i;
const safeRoute = /^\/[a-z0-9_\-/]*$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function sanitizeValue(value: unknown): string | number | boolean | string[] | number[] | boolean[] | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim().slice(0, 120) || null;
  if (Array.isArray(value)) {
    return value.slice(0, 8).map(sanitizeValue).filter((entry): entry is string | number | boolean => ["string", "number", "boolean"].includes(typeof entry));
  }
  return null;
}

function sanitizeMetadata(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => safeKey.test(key) && !blockedKey.test(key))
      .slice(0, 12)
      .map(([key, entry]) => [key, sanitizeValue(entry)])
      .filter(([, entry]) => entry !== null),
  );
}

function normalizeEvent(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Event must be an object.");
  const source = value as Record<string, unknown>;
  const eventName = String(source.event_name || "");
  const mode = String(source.experience_mode || "guest");
  const route = String(source.route || "/");
  const duration = Number(source.duration_ms);

  if (!allowedEvents.has(eventName)) throw new Error(`Unsupported analytics event: ${eventName || "missing"}.`);
  if (!safeModes.has(mode)) throw new Error("Unsupported analytics experience mode.");

  return {
    event_name: eventName,
    route: safeRoute.test(route) ? route.slice(0, 120) : "/",
    experience_mode: mode,
    success: source.success !== false,
    duration_ms: Number.isFinite(duration) && duration >= 0 ? Math.min(Math.round(duration), 300000) : null,
    metadata: sanitizeMetadata(source.metadata),
  };
}

async function resolveUser(request: Request, supabaseUrl: string, anonKey: string) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length);
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data } = await client.auth.getUser(token);
  return data.user || null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: { code: "method_not_allowed", message: "POST is required." } }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("Analytics server configuration is incomplete.");

    const body = await request.json();
    const rawEvents = Array.isArray(body?.events) ? body.events.slice(0, 12) : [];
    if (!rawEvents.length) return json({ accepted: 0 });

    const anonymousSessionId = String(body?.anonymous_session_id || "");
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const user = await resolveUser(request, supabaseUrl, anonKey);
    if (!user && !uuidPattern.test(anonymousSessionId)) {
      return json({ error: { code: "invalid_session", message: "A valid anonymous session is required." } }, 400);
    }

    const rows = rawEvents.map(normalizeEvent).map((event) => ({
      ...event,
      user_id: user?.id || null,
      anonymous_session_id: user ? null : anonymousSessionId,
    }));

    const service = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { error } = await service.from("analytics_events").insert(rows);
    if (error) throw error;

    return json({ accepted: rows.length });
  } catch (error) {
    console.error("Analytics event rejected:", { message: error instanceof Error ? error.message : "Unknown error" });
    return json({ error: { code: "invalid_analytics_payload", message: "Analytics could not be recorded." } }, 400);
  }
});
