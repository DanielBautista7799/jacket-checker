import { createClient, type User } from "@supabase/supabase-js";
import { SafeHttpError } from "./safeError.ts";

export type AuthContext = {
  user: User;
  authorization: string;
  userClient: ReturnType<typeof createClient>;
};

export async function requireAuthenticatedUser(request: Request): Promise<AuthContext> {
  const authorization = request.headers.get("authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization.startsWith("Bearer ") || !supabaseUrl || !anonKey) {
    throw new SafeHttpError(401, "authentication_required", "You must be signed in.");
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) {
    throw new SafeHttpError(401, "session_expired", "Your session has expired. Sign in again.");
  }
  return { user: data.user, authorization, userClient };
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new SafeHttpError(503, "server_configuration", "The server is not configured for this request.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function resolveOptionalUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization.startsWith("Bearer ") || !supabaseUrl || !anonKey) return null;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await userClient.auth.getUser(authorization.slice("Bearer ".length));
  return data.user || null;
}
