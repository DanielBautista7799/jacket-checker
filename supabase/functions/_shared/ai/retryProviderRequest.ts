import { AiProviderError } from "./aiErrors.ts";

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function retryProviderRequest<T>(
  operation: (attempt: number) => Promise<T>,
  {
    attempts = 3,
    baseDelayMs = 650,
  }: {
    attempts?: number;
    baseDelayMs?: number;
  } = {},
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AiProviderError && error.retryable;

      if (!retryable || attempt >= attempts) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * 180);
      await sleep(baseDelayMs * 2 ** (attempt - 1) + jitter);
    }
  }

  throw lastError;
}
