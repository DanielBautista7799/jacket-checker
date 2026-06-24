import { buildCorsHeaders } from "./cors.ts";

export class SafeHttpError extends Error {
  status: number;
  code: string;
  retryAfterSeconds?: number;

  constructor(status: number, code: string, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "SafeHttpError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
  requestId?: string,
  extraHeaders: HeadersInit = {},
): Response {
  const headers = buildCorsHeaders(request);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  if (requestId) headers.set("X-Request-Id", requestId);
  return new Response(JSON.stringify(body), { status, headers });
}

export function safeErrorResponse(
  request: Request,
  error: unknown,
  requestId?: string,
): Response {
  const safe = error instanceof SafeHttpError
    ? error
    : new SafeHttpError(500, "internal_error", "The request could not be completed.");
  const headers: Record<string, string> = {};
  if (safe.retryAfterSeconds) headers["Retry-After"] = String(safe.retryAfterSeconds);
  return jsonResponse(
    request,
    { success: false, error: { code: safe.code, message: safe.message }, requestId },
    safe.status,
    requestId,
    headers,
  );
}
