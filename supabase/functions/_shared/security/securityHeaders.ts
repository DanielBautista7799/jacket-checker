export const BASE_SECURITY_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Resource-Policy": "same-site",
};

export function withSecurityHeaders(
  headers: HeadersInit = {},
): Headers {
  const result = new Headers(BASE_SECURITY_HEADERS);
  new Headers(headers).forEach((value, key) => result.set(key, value));
  return result;
}
