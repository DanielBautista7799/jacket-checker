import { supabase } from "../lib/supabaseClient";
import { VISUAL_INTELLIGENCE_CONFIG } from "../config/visualIntelligenceConfig";

async function readFunctionError(error) {
  const response = error?.context;

  if (response instanceof Response) {
    try {
      const payload = await response.clone().json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    } catch {
      try {
        const text = await response.clone().text();
        if (text) {
          return text;
        }
      } catch {
        // Use the regular function error below.
      }
    }
  }

  return error?.message || "Jacket similarity is temporarily unavailable.";
}

async function invokeJacketEmbedding(body) {
  const { data, error } = await supabase.functions.invoke(
    "generate-jacket-embedding",
    { body }
  );

  if (error) {
    const message = await readFunctionError(error);
    const nextError = new Error(message);
    nextError.cause = error;
    throw nextError;
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Jacket similarity is temporarily unavailable."
    );
  }

  return data;
}

export async function requestJacketEmbedding(
  jacketId,
  { force = false } = {}
) {
  return invokeJacketEmbedding({
    action: "generate",
    jacketId,
    force,
  });
}

export async function requestJacketSimilarity(
  jacketId,
  {
    threshold =
      VISUAL_INTELLIGENCE_CONFIG.matching.minimumSimilarity,
    limit = VISUAL_INTELLIGENCE_CONFIG.matching.maximumResults,
  } = {}
) {
  return invokeJacketEmbedding({
    action: "similar",
    jacketId,
    threshold,
    limit,
  });
}

export async function previewJacketSimilarity(
  jacket,
  {
    excludeJacketId = null,
    threshold =
      VISUAL_INTELLIGENCE_CONFIG.matching.minimumSimilarity,
    limit = VISUAL_INTELLIGENCE_CONFIG.matching.maximumResults,
  } = {}
) {
  return invokeJacketEmbedding({
    action: "preview",
    jacket,
    excludeJacketId,
    threshold,
    limit,
  });
}

let embeddingConfigurationCache = null;
let embeddingConfigurationPromise = null;

export async function getJacketEmbeddingConfiguration({ force = false } = {}) {
  if (!force && embeddingConfigurationCache) {
    return embeddingConfigurationCache;
  }

  if (!force && embeddingConfigurationPromise) {
    return embeddingConfigurationPromise;
  }

  embeddingConfigurationPromise = invokeJacketEmbedding({
    action: "configuration",
  })
    .then((result) => {
      embeddingConfigurationCache = result.configuration || null;
      return embeddingConfigurationCache;
    })
    .finally(() => {
      embeddingConfigurationPromise = null;
    });

  return embeddingConfigurationPromise;
}

export async function fetchJacketEmbeddingRecords(userId) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("jacket_embeddings")
    .select(
      "id, user_id, wardrobe_item_id, provider, model, dimensions, source_hash, status, error_message, attempt_count, generated_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
