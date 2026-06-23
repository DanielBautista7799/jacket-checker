export const AI_CONFIG = Object.freeze({
  analysis: {
    defaultProvider: "gemini",
    supportedProviders: ["gemini", "openai", "manual"],
    analysisVersion: "phase10-v1",
  },
  embeddings: {
    dimensions: 768,
    functionName: "generate-jacket-embedding",
  },
});

export function formatAiProvider(provider) {
  const normalized = String(provider || "").toLowerCase();

  if (normalized === "openai") {
    return "OpenAI";
  }

  if (normalized === "gemini") {
    return "Gemini";
  }

  if (normalized === "manual") {
    return "Manual entry";
  }

  return provider || "Unknown provider";
}
