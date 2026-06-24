import { SafeHttpError } from "./safeError.ts";

export async function readJsonBody<T extends Record<string, unknown>>(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new SafeHttpError(415, "unsupported_content_type", "Use application/json.");
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new SafeHttpError(413, "payload_too_large", "The request body is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new SafeHttpError(413, "payload_too_large", "The request body is too large.");
  }
  try {
    const parsed = JSON.parse(text || "{}") as T;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid");
    }
    return parsed;
  } catch {
    throw new SafeHttpError(400, "invalid_json", "The request body is invalid.");
  }
}
