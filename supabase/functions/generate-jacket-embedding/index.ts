import type { SupabaseClient } from "@supabase/supabase-js";

import { buildCanonicalJacketDescriptor } from "../_shared/ai/buildCanonicalJacketDescriptor.ts";
import {
  EMBEDDING_DIMENSIONS,
  generateEmbedding,
  getEmbeddingConfiguration,
} from "../_shared/ai/embeddingProvider.ts";
import { AiProviderError } from "../_shared/ai/aiErrors.ts";

import { requireAuthenticatedUser } from "../_shared/security/auth.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";

const MATCH_THRESHOLD = 0.72;
const MATCH_LIMIT = 8;

type RawObject = Record<string, unknown>;
type AppClient = SupabaseClient;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

function cleanErrorMessage(error: unknown): string {
  if (error instanceof AiProviderError) {
    if (error.retryable) {
      return "Similarity matching is temporarily unavailable. Retry in a moment.";
    }

    if (error.status === 401 || error.status === 403) {
      return "The configured embedding provider is not authorized.";
    }

    return error.message.slice(0, 300);
  }

  return "Similarity matching is temporarily unavailable.";
}

async function hashSource(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getOwnedJacket(
  supabase: AppClient,
  userId: string,
  jacketId: string,
): Promise<{ jacket: RawObject; primaryImagePath: string | null }> {
  const [{ data: jacket, error: jacketError }, { data: images, error: imageError }] =
    await Promise.all([
      supabase
        .from("wardrobe_items")
        .select("*")
        .eq("id", jacketId)
        .eq("user_id", userId)
        .eq("category", "jacket")
        .single(),
      supabase
        .from("wardrobe_item_images")
        .select("image_path, is_primary, display_order")
        .eq("wardrobe_item_id", jacketId)
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true }),
    ]);

  if (jacketError || !jacket) {
    throw new AiProviderError({
      provider: "database",
      message: "The jacket could not be found.",
      status: 404,
      retryable: false,
      code: "jacket_not_found",
    });
  }

  if (imageError) {
    throw imageError;
  }

  const primaryImage = Array.isArray(images) ? images[0] : null;
  const primaryImagePath =
    asString(primaryImage?.image_path) || asString(jacket.image_path) || null;

  return { jacket: jacket as RawObject, primaryImagePath };
}

function sameProtection(first: RawObject, second: RawObject): boolean {
  const fields = ["warmth_rating", "rain_rating", "wind_rating"];
  return fields.every(
    (field) => Math.abs(Number(first[field]) - Number(second[field])) <= 1,
  );
}

function buildSimilarityDetails(
  queryItem: RawObject | null,
  matchItem: RawObject,
  vectorSimilarity: number,
) {
  const reasons: string[] = [];
  let metadataSignals = 0;

  if (queryItem) {
    if (
      asString(queryItem.subtype) &&
      asString(queryItem.subtype) === asString(matchItem.subtype)
    ) {
      reasons.push("Same jacket type");
      metadataSignals += 1;
    }

    if (
      asString(queryItem.primary_color) &&
      asString(queryItem.primary_color) === asString(matchItem.primary_color)
    ) {
      reasons.push("Same main color");
      metadataSignals += 1;
    }

    const queryMaterials = new Set(
      Array.isArray(queryItem.materials) ? queryItem.materials.map(String) : [],
    );
    const sharedMaterials = Array.isArray(matchItem.materials)
      ? matchItem.materials.map(String).filter((value) => queryMaterials.has(value))
      : [];

    if (sharedMaterials.length > 0) {
      reasons.push(`Shared material: ${sharedMaterials[0].replace(/_/g, " ")}`);
      metadataSignals += 1;
    }

    if (sameProtection(queryItem, matchItem)) {
      reasons.push("Similar weather protection");
      metadataSignals += 1;
    }
  }

  let category = "related";
  let label = "Related jacket";

  if (vectorSimilarity >= 0.93 && metadataSignals >= 2) {
    category = "very_likely_duplicate";
    label = "Very likely duplicate";
  } else if (vectorSimilarity >= 0.86) {
    category = "strongly_similar";
    label = "Strongly similar";
  }

  if (reasons.length === 0) {
    reasons.push("Similar visual and weather profile");
  }

  return {
    category,
    label,
    reasons: reasons.slice(0, 3),
    vectorSimilarity: Number(vectorSimilarity.toFixed(6)),
    metadataSignals,
  };
}

async function findMatches({
  supabase,
  vector,
  provider,
  model,
  excludeJacketId,
  queryItem,
  threshold = MATCH_THRESHOLD,
  limit = MATCH_LIMIT,
}: {
  supabase: AppClient;
  vector: number[] | string;
  provider: string;
  model: string;
  excludeJacketId: string | null;
  queryItem: RawObject | null;
  threshold?: number;
  limit?: number;
}) {
  const queryEmbedding = typeof vector === "string" ? vector : toVectorLiteral(vector);

  const { data: rawMatches, error: matchError } = await supabase.rpc(
    "match_user_jackets",
    {
      query_embedding: queryEmbedding,
      match_provider: provider,
      match_model: model,
      exclude_wardrobe_item_id: excludeJacketId,
      match_threshold: Math.max(0.5, Math.min(0.99, threshold)),
      match_count: Math.max(1, Math.min(20, limit)),
    },
  );

  if (matchError) {
    throw matchError;
  }

  const matches = Array.isArray(rawMatches) ? rawMatches : [];
  const ids = matches.map((entry) => entry.wardrobe_item_id).filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  const { data: items, error: itemError } = await supabase
    .from("wardrobe_items")
    .select(
      "id, name, category, subtype, primary_color, secondary_color, materials, warmth_rating, rain_rating, wind_rating, formality_rating, fit, style_tags, weather_use, archived, image_path",
    )
    .in("id", ids)
    .eq("category", "jacket");

  if (itemError) {
    throw itemError;
  }

  const itemMap = new Map((items || []).map((item) => [item.id, item]));

  return matches
    .map((entry) => {
      const item = itemMap.get(entry.wardrobe_item_id);
      if (!item) {
        return null;
      }

      const details = buildSimilarityDetails(
        queryItem,
        item as RawObject,
        Number(entry.similarity) || 0,
      );

      return {
        jacketId: item.id,
        jacket: item,
        provider: entry.provider,
        model: entry.model,
        ...details,
      };
    })
    .filter(Boolean);
}

async function markEmbeddingFailure({
  supabase,
  userId,
  jacketId,
  provider,
  model,
  descriptor,
  sourceHash,
  primaryImagePath,
  attemptCount,
  error,
}: {
  supabase: AppClient;
  userId: string;
  jacketId: string;
  provider: string;
  model: string;
  descriptor: string;
  sourceHash: string;
  primaryImagePath: string | null;
  attemptCount: number;
  error: unknown;
}) {
  const safeMessage = cleanErrorMessage(error);

  await supabase.from("jacket_embeddings").upsert(
    {
      user_id: userId,
      wardrobe_item_id: jacketId,
      provider,
      model,
      dimensions: EMBEDDING_DIMENSIONS,
      descriptor,
      source_hash: sourceHash,
      primary_image_path: primaryImagePath,
      status: "failed",
      error_message: safeMessage,
      attempt_count: attemptCount,
    },
    { onConflict: "wardrobe_item_id,provider,model" },
  );

  return safeMessage;
}

Deno.serve(async (request: Request): Promise<Response> => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const authenticated = await requireAuthenticatedUser(request);
    const auth = { supabase: authenticated.userClient, userId: authenticated.user.id };
    await enforceRateLimit({ request, functionName: "generate-jacket-embedding", userId: auth.userId, limit: 30, windowSeconds: 3600 });
    const body = await readJsonBody<RawObject>(request, 64 * 1024);
    const action = asString(body.action) || "generate";
    if (!["configuration", "preview", "generate", "similar"].includes(action)) {
      throw new SafeHttpError(400, "unsupported_action", "The requested embedding action is not supported.");
    }

    const config = getEmbeddingConfiguration();
    if (action === "configuration") {
      return jsonResponse(request, { success: true, configuration: config }, 200, requestId);
    }

    const thresholdValue = Number(body.threshold);
    const threshold = Number.isFinite(thresholdValue)
      ? Math.min(0.99, Math.max(0.5, thresholdValue))
      : MATCH_THRESHOLD;
    const limitValue = Number(body.limit);
    const limit = Number.isFinite(limitValue)
      ? Math.min(12, Math.max(1, Math.round(limitValue)))
      : MATCH_LIMIT;

    if (action === "preview") {
      const draft = body.jacket && typeof body.jacket === "object" && !Array.isArray(body.jacket)
        ? body.jacket as RawObject
        : null;
      if (!draft) throw new SafeHttpError(400, "jacket_required", "Jacket details are required for preview matching.");
      const safeDraft = { ...draft, category: "jacket" };
      const descriptor = buildCanonicalJacketDescriptor(safeDraft);
      if (descriptor.length > 4000) throw new SafeHttpError(400, "descriptor_too_large", "The jacket description is too large.");

      try {
        const embedding = await generateEmbedding(descriptor);
        if (embedding.values.length !== EMBEDDING_DIMENSIONS) {
          throw new SafeHttpError(502, "invalid_embedding_dimensions", "The embedding provider returned an incompatible result.");
        }
        const matches = await findMatches({
          supabase: auth.supabase,
          vector: embedding.values,
          provider: embedding.provider,
          model: embedding.model,
          excludeJacketId: asString(body.excludeJacketId) || null,
          queryItem: safeDraft,
          threshold,
          limit,
        });
        return jsonResponse(request, {
          success: true,
          action,
          provider: embedding.provider,
          model: embedding.model,
          dimensions: EMBEDDING_DIMENSIONS,
          matches,
        }, 200, requestId);
      } catch (error) {
        logSecurityEvent("warn", "embedding_preview_failed", { requestId, code: error instanceof AiProviderError ? error.code : "preview_failed" });
        return jsonResponse(request, {
          success: false,
          retryable: error instanceof AiProviderError ? error.retryable : true,
          error: cleanErrorMessage(error),
        }, error instanceof AiProviderError ? error.status : 500, requestId);
      }
    }

    const jacketId = asString(body.jacketId);
    if (!/^[0-9a-f-]{36}$/i.test(jacketId)) {
      throw new SafeHttpError(400, "invalid_jacket_id", "A valid jacket ID is required.");
    }

    let ownedJacket: { jacket: RawObject; primaryImagePath: string | null };
    try {
      ownedJacket = await getOwnedJacket(auth.supabase, auth.userId, jacketId);
    } catch (error) {
      return jsonResponse(request, { success: false, error: cleanErrorMessage(error) }, error instanceof AiProviderError ? error.status : 500, requestId);
    }

    const descriptor = buildCanonicalJacketDescriptor({ ...ownedJacket.jacket, category: "jacket" });
    if (descriptor.length > 4000) throw new SafeHttpError(400, "descriptor_too_large", "The jacket description is too large.");
    const sourceHash = await hashSource([
      descriptor,
      ownedJacket.primaryImagePath || "no-image",
      config.provider,
      config.model,
      String(EMBEDDING_DIMENSIONS),
    ].join("|"));

    const { data: existing } = await auth.supabase
      .from("jacket_embeddings")
      .select("*")
      .eq("wardrobe_item_id", jacketId)
      .eq("user_id", auth.userId)
      .eq("provider", config.provider)
      .eq("model", config.model)
      .maybeSingle();

    if (action === "similar") {
      if (!existing || existing.status !== "ready" || !existing.embedding) {
        return jsonResponse(request, {
          success: true,
          action,
          status: existing?.status || "missing",
          error: existing?.error_message || null,
          matches: [],
        }, 200, requestId);
      }
      try {
        const matches = await findMatches({
          supabase: auth.supabase,
          vector: existing.embedding,
          provider: config.provider,
          model: config.model,
          excludeJacketId: jacketId,
          queryItem: ownedJacket.jacket,
          threshold,
          limit,
        });
        return jsonResponse(request, {
          success: true,
          action,
          status: existing.status,
          provider: config.provider,
          model: config.model,
          sourceHash: existing.source_hash,
          matches,
        }, 200, requestId);
      } catch (error) {
        return jsonResponse(request, { success: false, error: cleanErrorMessage(error), matches: [] }, 500, requestId);
      }
    }

    const force = body.force === true;
    if (!force && existing?.status === "ready" && existing.source_hash === sourceHash && existing.embedding) {
      const matches = await findMatches({
        supabase: auth.supabase,
        vector: existing.embedding,
        provider: config.provider,
        model: config.model,
        excludeJacketId: jacketId,
        queryItem: ownedJacket.jacket,
      });
      return jsonResponse(request, {
        success: true,
        action: "generate",
        cached: true,
        status: "ready",
        provider: config.provider,
        model: config.model,
        dimensions: EMBEDDING_DIMENSIONS,
        sourceHash,
        matches,
      }, 200, requestId);
    }

    const attemptCount = Number(existing?.attempt_count || 0) + 1;
    const { error: processingError } = await auth.supabase.from("jacket_embeddings").upsert({
      user_id: auth.userId,
      wardrobe_item_id: jacketId,
      provider: config.provider,
      model: config.model,
      dimensions: EMBEDDING_DIMENSIONS,
      descriptor,
      source_hash: sourceHash,
      primary_image_path: ownedJacket.primaryImagePath,
      status: "processing",
      error_message: null,
      attempt_count: attemptCount,
    }, { onConflict: "wardrobe_item_id,provider,model" });
    if (processingError) throw new SafeHttpError(500, "embedding_state_failed", "Similarity matching could not be prepared.");

    try {
      const embedding = await generateEmbedding(descriptor);
      if (embedding.values.length !== EMBEDDING_DIMENSIONS) {
        throw new SafeHttpError(502, "invalid_embedding_dimensions", "The embedding provider returned an incompatible result.");
      }
      const vectorLiteral = toVectorLiteral(embedding.values);
      const { error: saveError } = await auth.supabase.from("jacket_embeddings").upsert({
        user_id: auth.userId,
        wardrobe_item_id: jacketId,
        provider: embedding.provider,
        model: embedding.model,
        dimensions: EMBEDDING_DIMENSIONS,
        embedding: vectorLiteral,
        descriptor,
        source_hash: sourceHash,
        primary_image_path: ownedJacket.primaryImagePath,
        status: "ready",
        error_message: null,
        attempt_count: attemptCount,
        generated_at: new Date().toISOString(),
      }, { onConflict: "wardrobe_item_id,provider,model" });
      if (saveError) throw saveError;

      const matches = await findMatches({
        supabase: auth.supabase,
        vector: embedding.values,
        provider: embedding.provider,
        model: embedding.model,
        excludeJacketId: jacketId,
        queryItem: ownedJacket.jacket,
      });
      return jsonResponse(request, {
        success: true,
        action: "generate",
        cached: false,
        status: "ready",
        provider: embedding.provider,
        model: embedding.model,
        dimensions: EMBEDDING_DIMENSIONS,
        sourceHash,
        matches,
      }, 200, requestId);
    } catch (error) {
      logSecurityEvent("warn", "embedding_generation_failed", { requestId, code: error instanceof AiProviderError ? error.code : "embedding_failed" });
      const safeMessage = await markEmbeddingFailure({
        supabase: auth.supabase,
        userId: auth.userId,
        jacketId,
        provider: config.provider,
        model: config.model,
        descriptor,
        sourceHash,
        primaryImagePath: ownedJacket.primaryImagePath,
        attemptCount,
        error,
      });
      return jsonResponse(request, {
        success: false,
        status: "failed",
        retryable: error instanceof AiProviderError ? error.retryable : true,
        error: safeMessage,
      }, error instanceof AiProviderError ? error.status : 500, requestId);
    }
  } catch (error) {
    return safeErrorResponse(request, error, requestId);
  }
});
