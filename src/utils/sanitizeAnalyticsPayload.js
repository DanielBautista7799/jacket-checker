import {
  ANALYTICS_EVENT_SET,
  ANALYTICS_MAX_METADATA_KEYS,
  ANALYTICS_MAX_STRING_LENGTH,
} from "../config/analyticsConfig.js";

const BLOCKED_KEY_PATTERN = /(?:email|token|secret|password|authorization|cookie|coordinate|latitude|longitude|\blat\b|\blon\b|image|path|url|prompt|response|vector|address|city|location_name|query_text)/i;
const SAFE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,47}$/;
const SAFE_ROUTE_PATTERN = /^\/[a-z0-9_\-/]*$/i;
const SAFE_MODES = new Set(["guest", "personalized", "developer"]);

function sanitizeValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.slice(0, ANALYTICS_MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map(sanitizeValue)
      .filter((entry) => entry !== null);
  }

  return null;
}

export function sanitizeAnalyticsMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const entries = Object.entries(metadata)
    .filter(([key]) => SAFE_KEY_PATTERN.test(key))
    .filter(([key]) => !BLOCKED_KEY_PATTERN.test(key))
    .slice(0, ANALYTICS_MAX_METADATA_KEYS);

  return Object.fromEntries(
    entries
      .map(([key, value]) => [key, sanitizeValue(value)])
      .filter(([, value]) => value !== null)
  );
}

export function sanitizeAnalyticsEvent(event) {
  if (!event || typeof event !== "object") {
    throw new Error("Analytics event must be an object.");
  }

  const eventName = String(event.event_name || event.eventName || "");
  if (!ANALYTICS_EVENT_SET.has(eventName)) {
    throw new Error(`Unsupported analytics event: ${eventName || "missing"}.`);
  }

  const mode = String(event.experience_mode || event.experienceMode || "guest");
  if (!SAFE_MODES.has(mode)) {
    throw new Error(`Unsupported analytics experience mode: ${mode}.`);
  }

  const route = String(event.route || "/");
  const safeRoute = SAFE_ROUTE_PATTERN.test(route) ? route.slice(0, 120) : "/";
  const duration = Number(event.duration_ms ?? event.durationMs);

  return {
    event_name: eventName,
    route: safeRoute,
    experience_mode: mode,
    success: event.success !== false,
    duration_ms:
      Number.isFinite(duration) && duration >= 0
        ? Math.min(Math.round(duration), 300000)
        : null,
    metadata: sanitizeAnalyticsMetadata(event.metadata),
  };
}

export default sanitizeAnalyticsEvent;
