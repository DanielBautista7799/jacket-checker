import { AiProviderError, isRetryableStatus } from "./aiErrors.ts";
import { retryProviderRequest } from "./retryProviderRequest.ts";

export const EMBEDDING_DIMENSIONS = 768;
const REQUEST_TIMEOUT_MS = 20_000;

type RawObject = Record<string, unknown>;

export interface EmbeddingResult {
  values: number[];
  provider: "gemini" | "openai";
  model: string;
}

function validateVector(values: unknown, provider: string): number[] {
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new AiProviderError({
      provider,
      message: `Embedding provider returned ${Array.isArray(values) ? values.length : 0} dimensions instead of ${EMBEDDING_DIMENSIONS}.`,
      status: 502,
      retryable: false,
      code: "invalid_embedding_dimensions",
    });
  }

  const numbers = values.map(Number);
  if (numbers.some((value) => !Number.isFinite(value))) {
    throw new AiProviderError({
      provider,
      message: "Embedding provider returned invalid numeric values.",
      status: 502,
      retryable: false,
      code: "invalid_embedding_values",
    });
  }

  return numbers;
}

async function fetchJson(
  url: string,
  options: RequestInit,
  provider: string,
): Promise<RawObject> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const rawText = await response.text();
    let payload: RawObject = {};

    try {
      payload = rawText ? JSON.parse(rawText) as RawObject : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const rawError = payload.error as RawObject | undefined;
      throw new AiProviderError({
        provider,
        message: typeof rawError?.message === "string"
          ? rawError.message
          : `${provider} embedding request failed.`,
        status: response.status,
        retryable: isRetryableStatus(response.status),
        code: "embedding_request_failed",
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    const timedOut = error instanceof DOMException && error.name === "AbortError";
    throw new AiProviderError({
      provider,
      message: timedOut ? "Embedding request timed out." : "Embedding request failed.",
      status: timedOut ? 504 : 502,
      retryable: true,
      code: timedOut ? "timeout" : "network_error",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function embedWithGemini(descriptor: string, model: string): Promise<EmbeddingResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new AiProviderError({
      provider: "gemini",
      message: "Gemini embedding provider is not configured.",
      status: 503,
      retryable: false,
      code: "provider_not_configured",
    });
  }

  return retryProviderRequest(async () => {
    const payload = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text: descriptor }] },
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
      "gemini",
    );

    const embedding = payload.embedding as RawObject | undefined;
    return {
      values: validateVector(embedding?.values, "gemini"),
      provider: "gemini",
      model,
    };
  });
}

async function embedWithOpenAi(descriptor: string, model: string): Promise<EmbeddingResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new AiProviderError({
      provider: "openai",
      message: "OpenAI embedding provider is not configured.",
      status: 503,
      retryable: false,
      code: "provider_not_configured",
    });
  }

  return retryProviderRequest(async () => {
    const payload = await fetchJson(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: descriptor,
          dimensions: EMBEDDING_DIMENSIONS,
          encoding_format: "float",
        }),
      },
      "openai",
    );

    const data = Array.isArray(payload.data) ? payload.data : [];
    const first = data[0] as RawObject | undefined;

    return {
      values: validateVector(first?.embedding, "openai"),
      provider: "openai",
      model,
    };
  });
}

export function getEmbeddingConfiguration(): {
  provider: "gemini" | "openai";
  model: string;
  dimensions: number;
} {
  const configuredProvider = (Deno.env.get("JACKET_EMBEDDING_PROVIDER") || "gemini")
    .trim()
    .toLowerCase();

  const provider = configuredProvider === "openai" ? "openai" : "gemini";
  const defaultModel = provider === "openai"
    ? "text-embedding-3-small"
    : "gemini-embedding-001";

  return {
    provider,
    model: Deno.env.get("JACKET_EMBEDDING_MODEL") || defaultModel,
    dimensions: EMBEDDING_DIMENSIONS,
  };
}

export async function generateEmbedding(
  descriptor: string,
): Promise<EmbeddingResult> {
  const config = getEmbeddingConfiguration();

  if (config.provider === "openai") {
    return embedWithOpenAi(descriptor, config.model);
  }

  return embedWithGemini(descriptor, config.model);
}
