import { createClient, type User } from "@supabase/supabase-js";

import { SafeHttpError } from "./safeError.ts";

function getPublicAuthConfiguration() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new SafeHttpError(
      503,
      "server_configuration",
      "The server is not configured for authentication requests.",
    );
  }

  return {
    supabaseUrl,
    anonKey,
  };
}

function createUserClient(
  supabaseUrl: string,
  anonKey: string,
  authorization: string,
) {
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

type UserClient = ReturnType<typeof createUserClient>;

export type AuthContext = {
  user: User;
  authorization: string;
  userClient: UserClient;
};

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthContext> {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new SafeHttpError(
      401,
      "authentication_required",
      "You must be signed in.",
    );
  }

  const { supabaseUrl, anonKey } =
    getPublicAuthConfiguration();

  const userClient = createUserClient(
    supabaseUrl,
    anonKey,
    authorization,
  );

  const token = authorization.slice("Bearer ".length);

  const { data, error } =
    await userClient.auth.getUser(token);

  if (error || !data.user) {
    throw new SafeHttpError(
      401,
      "session_expired",
      "Your session has expired. Sign in again.",
    );
  }

  return {
    user: data.user,
    authorization,
    userClient,
  };
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SafeHttpError(
      503,
      "server_configuration",
      "The server is not configured for this request.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function resolveOptionalUser(
  request: Request,
): Promise<User | null> {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const { supabaseUrl, anonKey } =
    getPublicAuthConfiguration();

  const userClient = createUserClient(
    supabaseUrl,
    anonKey,
    authorization,
  );

  const token = authorization.slice("Bearer ".length);

  const { data } = await userClient.auth.getUser(token);

  return data.user || null;
}