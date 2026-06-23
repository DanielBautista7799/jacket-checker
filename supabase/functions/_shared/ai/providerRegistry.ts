import type { JacketAnalysisProvider } from "./jacketAnalysisSchema.ts";
import { AiProviderError } from "./aiErrors.ts";
import { createGeminiProvider } from "./providers/geminiProvider.ts";
import { createManualProvider } from "./providers/manualProvider.ts";
import { createOpenAiProvider } from "./providers/openaiProvider.ts";

export type SupportedAnalysisProvider = "gemini" | "openai" | "manual";

export function getConfiguredAnalysisProvider(): SupportedAnalysisProvider {
  const configured = (Deno.env.get("JACKET_ANALYSIS_PROVIDER") || "gemini")
    .trim()
    .toLowerCase();

  if (configured === "openai" || configured === "manual") {
    return configured;
  }

  return "gemini";
}

export function getAvailableAnalysisProviders(): SupportedAnalysisProvider[] {
  const providers: SupportedAnalysisProvider[] = ["manual"];

  if (Deno.env.get("GEMINI_API_KEY")) {
    providers.unshift("gemini");
  }

  if (Deno.env.get("OPENAI_API_KEY")) {
    providers.push("openai");
  }

  return [...new Set(providers)];
}

export function createAnalysisProvider(
  requestedProvider?: string | null,
): JacketAnalysisProvider {
  const selected = (requestedProvider || getConfiguredAnalysisProvider())
    .trim()
    .toLowerCase();

  if (selected === "gemini") {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new AiProviderError({
        provider: "gemini",
        message: "Gemini is not configured.",
        status: 503,
        retryable: false,
        code: "provider_not_configured",
      });
    }

    return createGeminiProvider({
      apiKey,
      defaultModel:
        Deno.env.get("JACKET_GEMINI_ANALYSIS_MODEL") ||
        Deno.env.get("JACKET_ANALYSIS_MODEL") ||
        "gemini-2.5-flash",
    });
  }

  if (selected === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new AiProviderError({
        provider: "openai",
        message: "OpenAI is not configured.",
        status: 503,
        retryable: false,
        code: "provider_not_configured",
      });
    }

    return createOpenAiProvider({
      apiKey,
      defaultModel:
        Deno.env.get("JACKET_OPENAI_ANALYSIS_MODEL") ||
        Deno.env.get("JACKET_ANALYSIS_MODEL") ||
        "gpt-4.1-mini",
    });
  }

  if (selected === "manual") {
    return createManualProvider();
  }

  throw new AiProviderError({
    provider: selected || "unknown",
    message: "The requested analysis provider is not supported.",
    status: 400,
    retryable: false,
    code: "unsupported_provider",
  });
}
