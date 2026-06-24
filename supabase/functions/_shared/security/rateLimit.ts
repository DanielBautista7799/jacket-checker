import { createServiceClient } from "./auth.ts";
import { SafeHttpError } from "./safeError.ts";

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit({
  request,
  functionName,
  userId,
  limit,
  windowSeconds,
}: {
  request: Request;
  functionName: string;
  userId?: string | null;
  limit: number;
  windowSeconds: number;
}) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "guest";
  const salt = Deno.env.get("RATE_LIMIT_SALT") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "jacket-check-unconfigured";
  const scopeHash = await hash(`${salt}:${userId || forwarded}:${functionName}`);
  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("consume_edge_rate_limit", {
      p_scope_hash: scopeHash,
      p_function_name: functionName,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.allowed === false) {
      throw new SafeHttpError(429, "rate_limited", "Too many requests. Try again shortly.", Number(row.retry_after_seconds) || windowSeconds);
    }
  } catch (error) {
    if (error instanceof SafeHttpError) throw error;
    console.warn("Rate limit check unavailable; request continued safely.", { functionName });
  }
}
