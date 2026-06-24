import { requireAuthenticatedUser } from "./auth.ts";
import { SafeHttpError } from "./safeError.ts";

function values(name: string): Set<string> {
  return new Set(String(Deno.env.get(name) || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
}

export async function requireDeveloper(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  const ids = new Set([...values("DEVELOPER_USER_IDS"), ...values("TREND_ADMIN_USER_IDS")]);
  const emails = new Set([...values("DEVELOPER_EMAILS"), ...values("TREND_ADMIN_EMAILS")]);
  const allowed = ids.has(auth.user.id.toLowerCase()) || emails.has(String(auth.user.email || "").toLowerCase());
  if (!allowed) throw new SafeHttpError(403, "forbidden", "Developer access is not enabled for this account.");
  return auth;
}
