import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

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

const VALID_SEASONS = new Set([
  "spring",
  "summer",
  "fall",
  "winter",
  "transitional",
]);

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function safeError(message: string, code = "invalid_request", status = 400) {
  return json({ error: { code, message } }, status);
}

function parseCsvSecret(value: string | undefined) {
  return new Set(
    String(value || "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function ensureNoExternalLinks(value: unknown, field: string) {
  const text = String(value || "");
  if (/https?:\/\/|www\./i.test(text)) {
    throw new Error(`${field} cannot contain external links.`);
  }
  return text;
}

function normalizeStringArray(
  value: unknown,
  field: string,
  allowed: Set<string> | null = null,
) {
  const entries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const normalized = [...new Set(
    entries
      .map((entry) => String(entry).trim().toLowerCase())
      .filter(Boolean),
  )];

  if (normalized.length > 20) {
    throw new Error(`${field} can contain at most 20 values.`);
  }

  if (allowed) {
    const invalid = normalized.find((entry) => !allowed.has(entry));
    if (invalid) {
      throw new Error(`${field} contains unsupported value: ${invalid}.`);
    }
  }

  return normalized;
}

function normalizePhrases(value: unknown) {
  const object = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

  const normalizeList = (input: unknown, label: string) => {
    const list = Array.isArray(input) ? input : input ? [input] : [];
    const phrases = list
      .map((entry) => ensureNoExternalLinks(entry, label).trim())
      .filter(Boolean);

    if (phrases.length === 0) {
      throw new Error(`${label} requires at least one phrase.`);
    }

    if (phrases.length > 8) {
      throw new Error(`${label} can contain at most 8 phrases.`);
    }

    phrases.forEach((phrase) => {
      if (phrase.length > 280) {
        throw new Error(`${label} phrases must be 280 characters or fewer.`);
      }
    });

    return phrases;
  };

  return {
    subtle: normalizeList(object.subtle, "Subtle trend phrasing"),
    balanced: normalizeList(object.balanced, "Balanced trend phrasing"),
  };
}

function normalizeDate(value: unknown, field: string, endOfDay = false) {
  if (!value) {
    throw new Error(`${field} is required.`);
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} is not a valid date.`);
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function normalizeRule(input: unknown, userId: string, forUpdate = false) {
  if (!input || typeof input !== "object") {
    throw new Error("Trend rule payload must be an object.");
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

  if (!name || name.length > 120) {
    throw new Error("Name is required and must be 120 characters or fewer.");
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must contain lowercase letters, numbers, and hyphens only.");
  }

  if (description.length > 500) {
    throw new Error("Description must be 500 characters or fewer.");
  }

  if (!sourceLabel || sourceLabel.length > 120) {
    throw new Error("Source label is required and must be 120 characters or fewer.");
  }

  const startsAt = normalizeDate(source.starts_at, "Start date");
  const expiresAt = normalizeDate(source.expires_at, "Expiration date", true);

  if (new Date(expiresAt) <= new Date(startsAt)) {
    throw new Error("Expiration date must be after the start date.");
  }

  const weight = Number(source.weight ?? 0.5);
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new Error("Weight must be between 0 and 1.");
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

  if (!forUpdate) {
    result.created_by = userId;
  }

  if (source.id) {
    result.id = String(source.id);
  }

  return result;
}

async function requireAdmin(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase server configuration is incomplete.");
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Authentication is required.");
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("The authenticated user could not be verified.");
  }

  const allowedIds = parseCsvSecret(Deno.env.get("TREND_ADMIN_USER_IDS"));
  const allowedEmails = parseCsvSecret(Deno.env.get("TREND_ADMIN_EMAILS"));
  const userId = data.user.id.toLowerCase();
  const email = String(data.user.email || "").toLowerCase();

  if (!allowedIds.has(userId) && !allowedEmails.has(email)) {
    throw new Error(
      "Trend administration is not enabled for this account. Configure TREND_ADMIN_EMAILS or TREND_ADMIN_USER_IDS in Supabase secrets.",
    );
  }

  return {
    user: data.user,
    serviceClient: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return safeError("Only POST requests are supported.", "method_not_allowed", 405);
  }

  try {
    const { user, serviceClient } = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "list").toLowerCase();
    const payload = body?.payload || {};

    if (action === "list") {
      const { data, error } = await serviceClient
        .from("style_trend_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json({ rules: data || [] });
    }

    if (action === "preview") {
      const normalized = normalizeRule(payload, user.id, Boolean(payload?.id));
      return json({ rule: normalized });
    }

    if (action === "create") {
      const normalized = normalizeRule(payload, user.id, false);
      delete normalized.id;

      const { data, error } = await serviceClient
        .from("style_trend_rules")
        .insert(normalized)
        .select()
        .single();

      if (error) throw error;
      return json({ rule: data }, 201);
    }

    if (action === "update") {
      if (!payload?.id) return safeError("Rule id is required for update.");
      const normalized = normalizeRule(payload, user.id, true);
      const id = String(normalized.id);
      delete normalized.id;

      const { data, error } = await serviceClient
        .from("style_trend_rules")
        .update(normalized)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return json({ rule: data });
    }

    if (action === "enable" || action === "disable") {
      if (!payload?.id) return safeError("Rule id is required.");

      const { data, error } = await serviceClient
        .from("style_trend_rules")
        .update({
          is_active: action === "enable",
          updated_by: user.id,
        })
        .eq("id", String(payload.id))
        .select()
        .single();

      if (error) throw error;
      return json({ rule: data });
    }

    if (action === "import") {
      if (!Array.isArray(payload?.rules)) {
        return safeError("Import payload must contain a rules array.");
      }

      if (payload.rules.length === 0 || payload.rules.length > 100) {
        return safeError("Import between 1 and 100 rules at a time.");
      }

      const normalizedRules = payload.rules.map((rule) =>
        normalizeRule(rule, user.id, Boolean(rule?.id))
      );

      const { data, error } = await serviceClient
        .from("style_trend_rules")
        .upsert(normalizedRules, { onConflict: "slug" })
        .select();

      if (error) throw error;
      return json({ rules: data || [], importedCount: data?.length || 0 });
    }

    return safeError("Unsupported trend action.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trend administration failed.";
    const status = /Authentication|enabled for this account|verified/.test(message) ? 403 : 400;
    console.error("sync-style-trends error:", { message });
    return safeError(message, status === 403 ? "forbidden" : "invalid_request", status);
  }
});
