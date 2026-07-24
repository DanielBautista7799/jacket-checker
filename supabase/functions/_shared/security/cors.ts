import { withSecurityHeaders } from "./securityHeaders.ts";

const DEFAULT_TRUSTED_ORIGINS = [
"http://localhost:5173",
"http://127.0.0.1:5173",
"capacitor://localhost",
];

const ALLOWED_REQUEST_HEADERS = [
"authorization",
"x-client-info",
"x-application-name",
"apikey",
"content-type",
"x-request-id",
];

function configuredOrigins(): Set<string> {
const configuredValues = String(Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

return new Set([...DEFAULT_TRUSTED_ORIGINS, ...configuredValues]);
}

export function isOriginAllowed(request: Request): boolean {
const origin = request.headers.get("origin");

if (!origin) {
  return true;
}

return configuredOrigins().has(origin);
}

export function buildCorsHeaders(request: Request): Headers {
const headers = withSecurityHeaders();
const origin = request.headers.get("origin");

if (origin && configuredOrigins().has(origin)) {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.append("Vary", "Origin");
}

headers.set(
  "Access-Control-Allow-Headers",
  ALLOWED_REQUEST_HEADERS.join(", "),
);
headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
headers.set("Access-Control-Max-Age", "86400");

return headers;
}

export function handleCorsPreflight(request: Request): Response | null {
if (request.method !== "OPTIONS") {
  return null;
}

if (!isOriginAllowed(request)) {
  return new Response(null, {
    status: 403,
    headers: withSecurityHeaders(),
  });
}

return new Response(null, {
  status: 204,
  headers: buildCorsHeaders(request),
});
}