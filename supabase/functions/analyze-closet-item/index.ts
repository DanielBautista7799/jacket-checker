import {
  createAnalysisProvider,
  getAvailableAnalysisProviders,
} from "../_shared/ai/providerRegistry.ts";
import {
  AiProviderError,
  getSafeAiErrorMessage,
} from "../_shared/ai/aiErrors.ts";
import { requireAuthenticatedUser } from "../_shared/security/auth.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 7 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type RawObject = Record<string, unknown>;

function estimateBase64Bytes(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((value.length * 3) / 4) - padding);
}

function isValidBase64(value: string): boolean {
  return Boolean(value) && value.length % 4 !== 1 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > maxLength) throw new SafeHttpError(400, "invalid_request", "A request option is too long.");
  return text;
}

Deno.serve(async (request: Request): Promise<Response> => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const { user } = await requireAuthenticatedUser(request);
    await enforceRateLimit({ request, functionName: "analyze-closet-item", userId: user.id, limit: 12, windowSeconds: 3600 });
    const body = await readJsonBody<RawObject>(request, MAX_REQUEST_BYTES);
    const action = typeof body.action === "string" ? body.action : "analyze";

    if (action === "providers") {
      return jsonResponse(request, {
        success: true,
        defaultProvider: Deno.env.get("JACKET_ANALYSIS_PROVIDER") || "gemini",
        providers: getAvailableAnalysisProviders(),
      }, 200, requestId);
    }

    if (action !== "analyze") {
      throw new SafeHttpError(400, "unsupported_action", "The requested jacket-analysis action is not supported.");
    }

    const imageBase64 = body.imageBase64;
    const mimeType = body.mimeType;
    if (typeof imageBase64 !== "string" || !imageBase64) {
      throw new SafeHttpError(400, "image_required", "No image data was provided.");
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new SafeHttpError(400, "unsupported_image", "Use a JPG, PNG, or WebP image.");
    }
    if (!isValidBase64(imageBase64)) {
      throw new SafeHttpError(400, "invalid_image", "The supplied image data is invalid.");
    }
    if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
      throw new SafeHttpError(413, "image_too_large", "The image must be smaller than 5 MB.");
    }

    const requestedProvider = optionalText(body.provider, 40)?.toLowerCase() || null;
    const requestedModel = optionalText(body.model, 120);

    try {
      const provider = createAnalysisProvider(requestedProvider);
      const result = await provider.analyze({ imageBase64, mimeType, model: requestedModel });
      return jsonResponse(request, {
        success: true,
        provider: result.provider,
        model: result.model,
        analysisVersion: result.analysisVersion,
        availableProviders: getAvailableAnalysisProviders(),
        analysis: result.analysis,
        rawResponse: result.rawResponse,
      }, 200, requestId);
    } catch (error) {
      const providerError = error instanceof AiProviderError ? error : null;
      logSecurityEvent(providerError?.retryable ? "warn" : "error", "jacket_analysis_failed", {
        requestId,
        provider: providerError?.provider || "unknown",
        code: providerError?.code || "analysis_failed",
        status: providerError?.status || 500,
      });
      return jsonResponse(request, {
        success: false,
        provider: providerError?.provider || null,
        code: providerError?.code || "analysis_failed",
        retryable: providerError?.retryable || false,
        error: getSafeAiErrorMessage(error),
        availableProviders: getAvailableAnalysisProviders(),
      }, providerError?.status || 500, requestId);
    }
  } catch (error) {
    logSecurityEvent("warn", "jacket_analysis_rejected", {
      requestId,
      code: error instanceof SafeHttpError ? error.code : "internal_error",
    });
    return safeErrorResponse(request, error, requestId);
  }
});
