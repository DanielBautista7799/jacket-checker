export class AiProviderError extends Error {
  provider: string;
  status: number;
  retryable: boolean;
  code: string;

  constructor({
    provider,
    message,
    status = 502,
    retryable = false,
    code = "provider_error",
  }: {
    provider: string;
    message: string;
    status?: number;
    retryable?: boolean;
    code?: string;
  }) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.status = status;
    this.retryable = retryable;
    this.code = code;
  }
}

export function isRetryableStatus(status: number): boolean {
  return [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
}

export function getSafeAiErrorMessage(error: unknown): string {
  if (!(error instanceof AiProviderError)) {
    return "Automatic analysis is unavailable right now. You can retry or enter the jacket details manually.";
  }

  if (error.code === "provider_not_configured") {
    return "The selected AI provider is not configured. Choose another available provider or enter the jacket details manually.";
  }

  if (error.code === "provider_precondition_failed") {
    return "Gemini could not run for this project or region. Check the Gemini API project and billing settings, then retry or enter the jacket details manually.";
  }

  if (error.code === "model_not_found") {
    return "The configured AI model is unavailable. Update the model setting, redeploy the function, or enter the jacket details manually.";
  }

  if (error.code === "invalid_request") {
    return "The AI provider rejected the analysis request. Redeploy the latest analyze-wardrobe-item function and try again.";
  }

  if (error.status === 401 || error.status === 403) {
    return "The configured AI provider is not authorized. Check the server-side API key or enter the jacket details manually.";
  }

  if (error.retryable) {
    return "The AI service is busy or unavailable right now. Try again shortly, switch providers if available, or enter the jacket details manually.";
  }

  return "Automatic analysis is unavailable right now. You can retry or enter the jacket details manually.";
}
