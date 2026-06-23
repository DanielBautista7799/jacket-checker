import {
  JACKET_ANALYSIS_VERSION,
  JACKET_RESPONSE_SCHEMA,
  buildJacketAnalysisPrompt,
  type JacketAnalysisProvider,
  type JacketAnalysisProviderInput,
  type JacketAnalysisProviderResult,
} from "../jacketAnalysisSchema.ts";
import { AiProviderError, isRetryableStatus } from "../aiErrors.ts";
import { normalizeJacketAnalysis, parseJsonObject } from "../normalizeJacketAnalysis.ts";
import { retryProviderRequest } from "../retryProviderRequest.ts";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const REQUEST_TIMEOUT_MS = 25_000;

type RawObject = Record<string, unknown>;

function extractOpenAiText(payload: RawObject): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as RawObject).content)
      ? (item as RawObject).content as unknown[]
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const rawPart = part as RawObject;
      if (
        (rawPart.type === "output_text" || rawPart.type === "text") &&
        typeof rawPart.text === "string" &&
        rawPart.text.trim()
      ) {
        return rawPart.text;
      }
    }
  }

  return null;
}

async function requestOpenAi({
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildJacketAnalysisPrompt(),
              },
              {
                type: "input_image",
                image_url: `data:${mimeType};base64,${imageBase64}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "jacket_analysis",
            strict: true,
            schema: JACKET_RESPONSE_SCHEMA,
          },
        },
        max_output_tokens: 2048,
      }),
    });

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
        : "OpenAI analysis request failed.";

      throw new AiProviderError({
        provider: "openai",
        message,
        status: response.status,
        retryable: isRetryableStatus(response.status),
        code: "openai_request_failed",
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    const timedOut = error instanceof DOMException && error.name === "AbortError";
    throw new AiProviderError({
      provider: "openai",
      message: timedOut ? "OpenAI request timed out." : "OpenAI request failed.",
      status: timedOut ? 504 : 502,
      retryable: true,
      code: timedOut ? "timeout" : "network_error",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createOpenAiProvider({
  apiKey,
  defaultModel = DEFAULT_OPENAI_MODEL,
}: {
  apiKey: string;
  defaultModel?: string;
}): JacketAnalysisProvider {
  return {
    id: "openai",
    async analyze(input: JacketAnalysisProviderInput): Promise<JacketAnalysisProviderResult> {
      const model = input.model || defaultModel;

      return retryProviderRequest(async () => {
        const payload = await requestOpenAi({
          apiKey,
          model,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
        });

        const responseText = extractOpenAiText(payload);
        if (!responseText) {
          throw new AiProviderError({
            provider: "openai",
            message: "OpenAI returned no structured analysis.",
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
            provider: "openai",
            message: error instanceof Error ? error.message : "OpenAI returned invalid JSON.",
            status: 502,
            retryable: true,
            code: "invalid_json",
          });
        }

        return {
          analysis: normalizeJacketAnalysis(parsed),
          provider: "openai",
          model,
          analysisVersion: JACKET_ANALYSIS_VERSION,
          rawResponse: payload,
        };
      });
    },
  };
}
