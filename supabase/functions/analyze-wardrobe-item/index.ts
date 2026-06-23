import { createClient } from "@supabase/supabase-js";

import {
  getAvailableAnalysisProviders,
  createAnalysisProvider,
} from "../_shared/ai/providerRegistry.ts";
import {
  AiProviderError,
  getSafeAiErrorMessage,
} from "../_shared/ai/aiErrors.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type RawObject = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function estimateBase64Bytes(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((value.length * 3) / 4) - padding);
}

function isValidBase64(value: string): boolean {
  if (!value || value.length % 4 === 1) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function getRequestedProvider(body: RawObject): string | null {
  return typeof body.provider === "string" && body.provider.trim()
    ? body.provider.trim().toLowerCase()
    : null;
}

function getRequestedModel(body: RawObject): string | null {
  return typeof body.model === "string" && body.model.trim()
    ? body.model.trim()
    : null;
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonResponse(
      {
        success: false,
        error: "You must be signed in to analyze a jacket.",
      },
      401,
    );
  }

  let body: RawObject;
  try {
    body = await request.json() as RawObject;
  } catch {
    return jsonResponse(
      { success: false, error: "The request body is invalid." },
      400,
    );
  }

  const action = typeof body.action === "string" ? body.action : "analyze";

  if (action === "providers") {
    return jsonResponse({
      success: true,
      defaultProvider:
        Deno.env.get("JACKET_ANALYSIS_PROVIDER") || "gemini",
      providers: getAvailableAnalysisProviders(),
    });
  }

  if (action !== "analyze") {
    return jsonResponse(
      {
        success: false,
        error: "The requested jacket-analysis action is not supported.",
      },
      400,
    );
  }

  const imageBase64 = body.imageBase64;
  const mimeType = body.mimeType;
  const requestedProvider = getRequestedProvider(body);
  const requestedModel = getRequestedModel(body);

  if (typeof imageBase64 !== "string" || !imageBase64) {
    return jsonResponse(
      { success: false, error: "No image data was provided." },
      400,
    );
  }

  if (
    typeof mimeType !== "string" ||
    !ALLOWED_MIME_TYPES.has(mimeType)
  ) {
    return jsonResponse(
      { success: false, error: "Use a JPG, PNG, or WebP image." },
      400,
    );
  }

  if (!isValidBase64(imageBase64)) {
    return jsonResponse(
      { success: false, error: "The supplied image data is invalid." },
      400,
    );
  }

  if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
    return jsonResponse(
      { success: false, error: "The image must be smaller than 5 MB." },
      413,
    );
  }

  try {
    const provider = createAnalysisProvider(requestedProvider);
    const result = await provider.analyze({
      imageBase64,
      mimeType,
      model: requestedModel,
    });

    return jsonResponse({
      success: true,
      provider: result.provider,
      model: result.model,
      analysisVersion: result.analysisVersion,
      availableProviders: getAvailableAnalysisProviders(),
      analysis: result.analysis,
      rawResponse: result.rawResponse,
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      console.error(
        "Analyze jacket provider failure:",
        JSON.stringify({
          provider: error.provider,
          code: error.code,
          status: error.status,
          retryable: error.retryable,
          message: error.message.slice(0, 400),
        }),
      );
    } else {
      console.error(
        "Analyze jacket failure:",
        error instanceof Error ? error.message : "Unknown function error",
      );
    }

    const status = error instanceof AiProviderError ? error.status : 500;

    return jsonResponse(
      {
        success: false,
        provider: error instanceof AiProviderError ? error.provider : null,
        code: error instanceof AiProviderError
          ? error.code
          : "analysis_failed",
        retryable: error instanceof AiProviderError
          ? error.retryable
          : false,
        error: getSafeAiErrorMessage(error),
        availableProviders: getAvailableAnalysisProviders(),
      },
      status,
    );
  }
});
