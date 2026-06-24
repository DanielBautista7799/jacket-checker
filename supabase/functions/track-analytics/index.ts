import { createServiceClient, resolveOptionalUser } from "../_shared/security/auth.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";

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
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => safeKey.test(key) && !blockedKey.test(key))
      .slice(0, 12)
      .map(([key, entry]) => [key, sanitizeValue(entry)])
      .filter(([, entry]) => entry !== null),
  );
}

function normalizeEvent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeHttpError(400, "invalid_event", "Each analytics event must be an object.");
  }
  const source = value as Record<string, unknown>;
  const eventName = String(source.event_name || "");
  const mode = String(source.experience_mode || "guest");
  const route = String(source.route || "/");
  const duration = Number(source.duration_ms);
  if (!allowedEvents.has(eventName)) throw new SafeHttpError(400, "unsupported_event", "An analytics event is not supported.");
  if (!safeModes.has(mode)) throw new SafeHttpError(400, "unsupported_mode", "The analytics experience mode is invalid.");
  return {
    event_name: eventName,
    route: safeRoute.test(route) ? route.slice(0, 120) : "/",
    experience_mode: mode,
    success: source.success !== false,
    duration_ms: Number.isFinite(duration) && duration >= 0 ? Math.min(Math.round(duration), 300000) : null,
    metadata: sanitizeMetadata(source.metadata),
  };
}

Deno.serve(async (request: Request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const user = await resolveOptionalUser(request);
    await enforceRateLimit({
      request,
      functionName: "track-analytics",
      userId: user?.id || null,
      limit: user ? 600 : 240,
      windowSeconds: 3600,
    });

    const body = await readJsonBody<Record<string, unknown>>(request, 48 * 1024);
    const rawEvents = Array.isArray(body.events) ? body.events.slice(0, 12) : [];
    if (rawEvents.length === 0) return jsonResponse(request, { accepted: 0 }, 200, requestId);

    const anonymousSessionId = String(body.anonymous_session_id || "");
    if (!user && !uuidPattern.test(anonymousSessionId)) {
      throw new SafeHttpError(400, "invalid_session", "A valid anonymous session is required.");
    }

    const rows = rawEvents.map(normalizeEvent).map((event) => ({
      ...event,
      user_id: user?.id || null,
      anonymous_session_id: user ? null : anonymousSessionId,
    }));

    const service = createServiceClient();
    const { error } = await service.from("analytics_events").insert(rows);
    if (error) throw new SafeHttpError(503, "analytics_unavailable", "Analytics could not be recorded.");
    return jsonResponse(request, { accepted: rows.length }, 200, requestId);
  } catch (error) {
    return safeErrorResponse(request, error, requestId);
  }
});
