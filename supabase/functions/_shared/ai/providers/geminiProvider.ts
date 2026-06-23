import {
  JACKET_ANALYSIS_VERSION,
  JACKET_RESPONSE_SCHEMA,
  buildJacketAnalysisPrompt,
  type JacketAnalysisProvider,
  type JacketAnalysisProviderInput,
  type JacketAnalysisProviderResult,
} from "../jacketAnalysisSchema.ts";
import { AiProviderError, isRetryableStatus } from "../aiErrors.ts";
import {
  normalizeJacketAnalysis,
  parseJsonObject,
} from "../normalizeJacketAnalysis.ts";
import { retryProviderRequest } from "../retryProviderRequest.ts";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 25_000;

type RawObject = Record<string, unknown>;

type GeminiRequestMode = "structured" | "json";

function extractGeminiText(payload: RawObject): string | null {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = candidates[0] as RawObject | undefined;
  const content = first?.content as RawObject | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];

  for (const part of parts) {
    if (part && typeof part === "object") {
      const text = (part as RawObject).text;
      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

function classifyGeminiError({
  responseStatus,
  providerStatus,
}: {
  responseStatus: number;
  providerStatus: string;
}): string {
  if (providerStatus === "FAILED_PRECONDITION") {
    return "provider_precondition_failed";
  }

  if (providerStatus === "INVALID_ARGUMENT" || responseStatus === 400) {
    return "invalid_request";
  }

  if (providerStatus === "NOT_FOUND" || responseStatus === 404) {
    return "model_not_found";
  }

  if (
    providerStatus === "PERMISSION_DENIED" ||
    responseStatus === 401 ||
    responseStatus === 403
  ) {
    return "provider_unauthorized";
  }

  return "gemini_request_failed";
}

function shouldRetryWithoutSchema(error: AiProviderError): boolean {
  if (error.status !== 400 || error.code !== "invalid_request") {
    return false;
  }

  const message = error.message.toLowerCase();
  return [
    "schema",
    "response",
    "generationconfig",
    "generation_config",
    "additionalproperties",
    "additional properties",
    "invalid argument",
    "unknown name",
  ].some((token) => message.includes(token));
}

function buildRequestBody({
  imageBase64,
  mimeType,
  mode,
}: {
  imageBase64: string;
  mimeType: string;
  mode: GeminiRequestMode;
}): RawObject {
  const generationConfig: RawObject = {
    temperature: 0.1,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  };

  if (mode === "structured") {
    generationConfig.responseSchema = JACKET_RESPONSE_SCHEMA;
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
          { text: buildJacketAnalysisPrompt() },
        ],
      },
    ],
    generationConfig,
  };
}

async function performGeminiRequest({
  apiKey,
  model,
  imageBase64,
  mimeType,
  mode,
}: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
  mode: GeminiRequestMode;
}): Promise<RawObject> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(
          buildRequestBody({ imageBase64, mimeType, mode }),
        ),
      },
    );

    const rawText = await response.text();
    let payload: RawObject = {};

    try {
      payload = rawText ? JSON.parse(rawText) as RawObject : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const providerError = payload.error as RawObject | undefined;
      const message = typeof providerError?.message === "string"
        ? providerError.message
        : "Gemini analysis request failed.";
      const providerStatus = typeof providerError?.status === "string"
        ? providerError.status
        : "";

      throw new AiProviderError({
        provider: "gemini",
        message,
        status: response.status,
        retryable: isRetryableStatus(response.status),
        code: classifyGeminiError({
          responseStatus: response.status,
          providerStatus,
        }),
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    const timedOut = error instanceof DOMException && error.name === "AbortError";
    throw new AiProviderError({
      provider: "gemini",
      message: timedOut ? "Gemini request timed out." : "Gemini request failed.",
      status: timedOut ? 504 : 502,
      retryable: true,
      code: timedOut ? "timeout" : "network_error",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestGemini({
  apiKey,
  model,
  imageBase64,
  mimeType,
}: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
}): Promise<RawObject> {
  try {
    return await performGeminiRequest({
      apiKey,
      model,
      imageBase64,
      mimeType,
      mode: "structured",
    });
  } catch (error) {
    if (!(error instanceof AiProviderError) || !shouldRetryWithoutSchema(error)) {
      throw error;
    }

    console.warn(
      "Gemini rejected the structured response schema. Retrying once in JSON mode without a response schema.",
    );

    return performGeminiRequest({
      apiKey,
      model,
      imageBase64,
      mimeType,
      mode: "json",
    });
  }
}

export function createGeminiProvider({
  apiKey,
  defaultModel = DEFAULT_GEMINI_MODEL,
}: {
  apiKey: string;
  defaultModel?: string;
}): JacketAnalysisProvider {
  return {
    id: "gemini",
    async analyze(
      input: JacketAnalysisProviderInput,
    ): Promise<JacketAnalysisProviderResult> {
      const model = input.model || defaultModel;

      return retryProviderRequest(async () => {
        const payload = await requestGemini({
          apiKey,
          model,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
        });

        const responseText = extractGeminiText(payload);
        if (!responseText) {
          throw new AiProviderError({
            provider: "gemini",
            message: "Gemini returned no structured analysis.",
            status: 502,
            retryable: true,
            code: "empty_response",
          });
        }

        let parsed: RawObject;
        try {
          parsed = parseJsonObject(responseText);
        } catch (error) {
          throw new AiProviderError({
            provider: "gemini",
            message: error instanceof Error
              ? error.message
              : "Gemini returned invalid JSON.",
            status: 502,
            retryable: true,
            code: "invalid_json",
          });
        }

        return {
          analysis: normalizeJacketAnalysis(parsed),
          provider: "gemini",
          model,
          analysisVersion: JACKET_ANALYSIS_VERSION,
          rawResponse: payload,
        };
      });
    },
  };
}
