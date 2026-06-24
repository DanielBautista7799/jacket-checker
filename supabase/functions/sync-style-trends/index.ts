import { createServiceClient } from "../_shared/security/auth.ts";
import { requireDeveloper } from "../_shared/security/adminAccess.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";

const VALID_STYLES = new Set([
  "streetwear",
  "minimal",
  "athletic",
  "smart_casual",
  "techwear",
  "vintage",
  "skater",
  "outdoor",
]);

const VALID_SEASONS = new Set(["spring", "summer", "fall", "winter", "transitional"]);
const VALID_CLIMATE_TAGS = new Set([
  "hot",
  "warm",
  "mild",
  "cold",
  "rain",
  "wind",
  "rain_wind",
  "dry",
  "transitional",
]);
const VALID_ACTIONS = new Set(["list", "preview", "create", "update", "enable", "disable", "import"]);

function ensureNoExternalLinks(value: unknown, field: string) {
  const text = String(value || "");
  if (/https?:\/\/|www\./i.test(text)) {
    throw new SafeHttpError(400, "external_links_not_allowed", `${field} cannot contain external links.`);
  }
  return text;
}

function normalizeStringArray(value: unknown, field: string, allowed: Set<string> | null = null) {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const normalized = [...new Set(entries.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean))];
  if (normalized.length > 20) {
    throw new SafeHttpError(400, "too_many_values", `${field} can contain at most 20 values.`);
  }
  if (allowed) {
    const invalid = normalized.find((entry) => !allowed.has(entry));
    if (invalid) {
      throw new SafeHttpError(400, "unsupported_value", `${field} contains unsupported value: ${invalid}.`);
    }
  }
  return normalized;
}

function normalizePhrases(value: unknown) {
  const object = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const normalizeList = (input: unknown, label: string) => {
    const list = Array.isArray(input) ? input : input ? [input] : [];
    const phrases = list.map((entry) => ensureNoExternalLinks(entry, label).trim()).filter(Boolean);
    if (phrases.length === 0) throw new SafeHttpError(400, "missing_phrase", `${label} requires at least one phrase.`);
    if (phrases.length > 8) throw new SafeHttpError(400, "too_many_phrases", `${label} can contain at most 8 phrases.`);
    phrases.forEach((phrase) => {
      if (phrase.length > 280) throw new SafeHttpError(400, "phrase_too_long", `${label} phrases must be 280 characters or fewer.`);
    });
    return phrases;
  };

  return {
    subtle: normalizeList(object.subtle, "Subtle trend phrasing"),
    balanced: normalizeList(object.balanced, "Balanced trend phrasing"),
  };
}

function normalizeDate(value: unknown, field: string, endOfDay = false) {
  if (!value) throw new SafeHttpError(400, "date_required", `${field} is required.`);
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new SafeHttpError(400, "invalid_date", `${field} is not a valid date.`);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function normalizeRule(input: unknown, userId: string, forUpdate = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SafeHttpError(400, "invalid_rule", "Trend rule payload must be an object.");
  }

  const source = input as Record<string, unknown>;
  const name = ensureNoExternalLinks(source.name, "Name").trim();
  const slug = String(source.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const description = ensureNoExternalLinks(source.description, "Description").trim();
  const sourceLabel = ensureNoExternalLinks(source.source_label, "Source label").trim();

  if (!name || name.length > 120) throw new SafeHttpError(400, "invalid_name", "Name is required and must be 120 characters or fewer.");
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new SafeHttpError(400, "invalid_slug", "Slug must contain lowercase letters, numbers, and hyphens only.");
  }
  if (description.length > 500) throw new SafeHttpError(400, "description_too_long", "Description must be 500 characters or fewer.");
  if (!sourceLabel || sourceLabel.length > 120) throw new SafeHttpError(400, "invalid_source_label", "Source label is required and must be 120 characters or fewer.");

  const startsAt = normalizeDate(source.starts_at, "Start date");
  const expiresAt = normalizeDate(source.expires_at, "Expiration date", true);
  if (new Date(expiresAt) <= new Date(startsAt)) {
    throw new SafeHttpError(400, "invalid_date_range", "Expiration date must be after the start date.");
  }

  const weight = Number(source.weight ?? 0.5);
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new SafeHttpError(400, "invalid_weight", "Weight must be between 0 and 1.");
  }

  const result: Record<string, unknown> = {
    name,
    slug,
    description,
    seasons: normalizeStringArray(source.seasons, "Seasons", VALID_SEASONS),
    climate_tags: normalizeStringArray(source.climate_tags, "Climate tags", VALID_CLIMATE_TAGS),
    style_tags: normalizeStringArray(source.style_tags, "Style tags", VALID_STYLES),
    jacket_subtypes: normalizeStringArray(source.jacket_subtypes, "Jacket subtypes"),
    color_families: normalizeStringArray(source.color_families, "Color families"),
    fit_tags: normalizeStringArray(source.fit_tags, "Fit tags"),
    material_tags: normalizeStringArray(source.material_tags, "Material tags"),
    suggestion_phrases: normalizePhrases(source.suggestion_phrases),
    source_label: sourceLabel,
    source_date: source.source_date || null,
    starts_at: startsAt,
    expires_at: expiresAt,
    weight,
    is_active: source.is_active !== false,
    updated_by: userId,
  };

  if (!forUpdate) result.created_by = userId;
  if (source.id) result.id = String(source.id);
  return result;
}

Deno.serve(async (request: Request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const { user } = await requireDeveloper(request);
    await enforceRateLimit({ request, functionName: "sync-style-trends", userId: user.id, limit: 60, windowSeconds: 3600 });
    const body = await readJsonBody<Record<string, unknown>>(request, 256 * 1024);
    const action = String(body.action || "list").toLowerCase();
    if (!VALID_ACTIONS.has(action)) throw new SafeHttpError(400, "unsupported_action", "Unsupported trend action.");
    const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? body.payload as Record<string, unknown>
      : {};
    const serviceClient = createServiceClient();

    if (action === "list") {
      const { data, error } = await serviceClient.from("style_trend_rules").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return jsonResponse(request, { rules: data || [] }, 200, requestId);
    }

    if (action === "preview") {
      return jsonResponse(request, { rule: normalizeRule(payload, user.id, Boolean(payload.id)) }, 200, requestId);
    }

    if (action === "create") {
      const normalized = normalizeRule(payload, user.id, false);
      delete normalized.id;
      const { data, error } = await serviceClient.from("style_trend_rules").insert(normalized).select().single();
      if (error) throw error;
      return jsonResponse(request, { rule: data }, 201, requestId);
    }

    if (action === "update") {
      if (!payload.id) throw new SafeHttpError(400, "rule_id_required", "Rule id is required for update.");
      const normalized = normalizeRule(payload, user.id, true);
      const id = String(normalized.id);
      delete normalized.id;
      const { data, error } = await serviceClient.from("style_trend_rules").update(normalized).eq("id", id).select().single();
      if (error) throw error;
      return jsonResponse(request, { rule: data }, 200, requestId);
    }

    if (action === "enable" || action === "disable") {
      if (!payload.id) throw new SafeHttpError(400, "rule_id_required", "Rule id is required.");
      const { data, error } = await serviceClient.from("style_trend_rules").update({
        is_active: action === "enable",
        updated_by: user.id,
      }).eq("id", String(payload.id)).select().single();
      if (error) throw error;
      return jsonResponse(request, { rule: data }, 200, requestId);
    }

    const rules = Array.isArray(payload.rules) ? payload.rules : [];
    if (rules.length === 0 || rules.length > 100) {
      throw new SafeHttpError(400, "invalid_import_count", "Import between 1 and 100 rules at a time.");
    }
    const normalizedRules = rules.map((rule) => normalizeRule(rule, user.id, Boolean((rule as Record<string, unknown>)?.id)));
    const slugs = normalizedRules.map((rule) => String(rule.slug));
    if (new Set(slugs).size !== slugs.length) {
      throw new SafeHttpError(400, "duplicate_rules", "The import contains duplicate trend slugs.");
    }
    const { data, error } = await serviceClient.from("style_trend_rules").upsert(normalizedRules, { onConflict: "slug" }).select();
    if (error) throw error;
    return jsonResponse(request, { rules: data || [], importedCount: data?.length || 0 }, 200, requestId);
  } catch (error) {
    logSecurityEvent("warn", "trend_admin_request_rejected", {
      requestId,
      code: error instanceof SafeHttpError ? error.code : "trend_admin_error",
    });
    return safeErrorResponse(request, error, requestId);
  }
});
