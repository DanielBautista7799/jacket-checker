import { createClient } from "@supabase/supabase-js";

import { requireAuthenticatedUser } from "../_shared/security/auth.ts";
import {
  handleCorsPreflight,
  isOriginAllowed,
} from "../_shared/security/cors.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";
import { validatePassword } from "../_shared/security/passwordPolicy.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import {
  jsonResponse,
  safeErrorResponse,
  SafeHttpError,
} from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";

type PasswordAction =
  | "sign-up"
  | "change-password"
  | "reset-password";

type PasswordRequest = {
  action?: unknown;
  payload?: unknown;
};

type PasswordPayload = {
  email?: unknown;
  password?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  emailRedirectTo?: unknown;
};

type JwtAmrEntry = {
  method?: unknown;
};

type JwtPayload = {
  amr?: unknown;
};

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_EMAIL_LENGTH = 320;
const MAX_CURRENT_PASSWORD_LENGTH = 256;

const NATIVE_REQUEST_ORIGIN =
  "capacitor://localhost";

const NATIVE_AUTH_CALLBACK =
  "jacketchecker://auth/callback";

function getAuthConfiguration() {
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY");

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

function createAnonClient() {
  const {
    supabaseUrl,
    anonKey,
  } = getAuthConfiguration();

  /*
   * Signup is performed by this Edge Function so the
   * password policy cannot be bypassed. The native app
   * does not possess a PKCE verifier for this server-side
   * signup request, so confirmation uses the implicit
   * callback and the app establishes the returned session.
   */
  return createClient(
    supabaseUrl,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
      },
    },
  );
}

function normalizeEmail(
  value: unknown,
): string {
  const email =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  if (
    !EMAIL_PATTERN.test(email) ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    throw new SafeHttpError(
      400,
      "invalid_email",
      "Enter a valid email address.",
    );
  }

  return email;
}

function normalizeCurrentPassword(
  value: unknown,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length >
      MAX_CURRENT_PASSWORD_LENGTH
  ) {
    throw new SafeHttpError(
      400,
      "invalid_current_password",
      "Enter your current password.",
    );
  }

  return value;
}

function isExactNativeAuthCallback(
  value: string,
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "jacketchecker:" &&
      url.hostname === "auth" &&
      url.pathname === "/callback" &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

function normalizeSignupRedirect(
  request: Request,
  value: unknown,
): string {
  const requestOrigin =
    request.headers.get("origin") || "";

  const redirectValue =
    typeof value === "string"
      ? value.trim()
      : "";

  if (
    requestOrigin ===
      NATIVE_REQUEST_ORIGIN &&
    isExactNativeAuthCallback(
      redirectValue,
    )
  ) {
    return NATIVE_AUTH_CALLBACK;
  }

  try {
    const requestOriginUrl =
      new URL(requestOrigin);

    const redirectUrl =
      new URL(redirectValue);

    const secureWebProtocol =
      requestOriginUrl.protocol ===
        "https:" ||
      requestOriginUrl.protocol ===
        "http:";

    if (
      !secureWebProtocol ||
      redirectUrl.protocol !==
        requestOriginUrl.protocol ||
      redirectUrl.origin !==
        requestOriginUrl.origin ||
      redirectUrl.pathname !== "/app" ||
      redirectUrl.username !== "" ||
      redirectUrl.password !== "" ||
      redirectUrl.search !== "" ||
      redirectUrl.hash !== ""
    ) {
      throw new Error(
        "invalid redirect",
      );
    }

    return redirectUrl.toString();
  } catch {
    throw new SafeHttpError(
      400,
      "invalid_redirect",
      "The account confirmation destination is invalid.",
    );
  }
}

function parseJwtPayload(
  authorization: string,
): JwtPayload {
  try {
    const token = authorization.replace(
      /^Bearer\s+/i,
      "",
    );

    const encodedPayload =
      token.split(".")[1] || "";

    const normalized =
      encodedPayload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded = normalized.padEnd(
      normalized.length +
        ((4 -
          (normalized.length % 4)) %
          4),
      "=",
    );

    return JSON.parse(
      atob(padded),
    ) as JwtPayload;
  } catch {
    throw new SafeHttpError(
      401,
      "invalid_session",
      "Your session is invalid. Request a new password-reset link.",
    );
  }
}

function requireRecoveryAuthentication(
  authorization: string,
): void {
  const payload =
    parseJwtPayload(authorization);

  const entries = Array.isArray(
    payload.amr,
  )
    ? payload.amr
    : [];

  const hasRecoveryMethod =
    entries.some((entry) => {
      if (typeof entry === "string") {
        return entry === "recovery";
      }

      if (
        !entry ||
        typeof entry !== "object"
      ) {
        return false;
      }

      return (
        (entry as JwtAmrEntry)
          .method === "recovery"
      );
    });

  if (!hasRecoveryMethod) {
    throw new SafeHttpError(
      403,
      "recovery_session_required",
      "Use a valid password-reset email before choosing a new password.",
    );
  }
}

function mapSignupError(
  error: {
    message?: string;
    status?: number;
  } | null,
) {
  const message = String(
    error?.message || "",
  );

  if (
    Number(error?.status) === 429 ||
    /rate limit|too many requests/i.test(
      message,
    )
  ) {
    return new SafeHttpError(
      429,
      "rate_limited",
      "Too many account requests. Wait a moment and try again.",
      60,
    );
  }

  if (
    /already registered|already exists/i.test(
      message,
    )
  ) {
    return new SafeHttpError(
      400,
      "account_exists",
      "An account may already exist with that email. Try signing in or recovering your password.",
    );
  }

  return new SafeHttpError(
    400,
    "signup_failed",
    "The account could not be created. Check the email and password, then try again.",
  );
}

async function updatePasswordThroughAuth({
  authorization,
  password,
  currentPassword,
}: {
  authorization: string;
  password: string;
  currentPassword?: string;
}) {
  const {
    supabaseUrl,
    anonKey,
  } = getAuthConfiguration();

  const response = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      method: "PUT",
      headers: {
        apikey: anonKey,
        Authorization: authorization,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        password,
        ...(currentPassword
          ? {
              current_password:
                currentPassword,
            }
          : {}),
      }),
    },
  );

  let body: {
    message?: string;
    msg?: string;
  } = {};

  try {
    body = await response.json();
  } catch {
    // A generic safe error is returned below.
  }

  if (!response.ok) {
    const message = String(
      body.message ||
        body.msg ||
        "",
    );

    if (
      response.status === 429 ||
      /rate limit|too many requests/i.test(
        message,
      )
    ) {
      throw new SafeHttpError(
        429,
        "rate_limited",
        "Too many password requests. Wait a moment and try again.",
        60,
      );
    }

    if (
      /current password|invalid login credentials/i.test(
        message,
      )
    ) {
      throw new SafeHttpError(
        400,
        "current_password_incorrect",
        "Your current password is incorrect.",
      );
    }

    if (
      /same password|different from the old password/i.test(
        message,
      )
    ) {
      throw new SafeHttpError(
        400,
        "password_reused",
        "Choose a password that is different from your current password.",
      );
    }

    if (
      /password should|weak password|characters/i.test(
        message,
      )
    ) {
      throw new SafeHttpError(
        400,
        "weak_password",
        "The password does not meet the server password policy.",
      );
    }

    throw new SafeHttpError(
      400,
      "password_update_failed",
      "The password could not be updated. Try again.",
    );
  }
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    const preflight =
      handleCorsPreflight(request);

    if (preflight) {
      return preflight;
    }

    const requestId =
      getRequestId(request);

    try {
      if (!isOriginAllowed(request)) {
        throw new SafeHttpError(
          403,
          "origin_not_allowed",
          "This request origin is not allowed.",
        );
      }

      if (request.method !== "POST") {
        throw new SafeHttpError(
          405,
          "method_not_allowed",
          "POST is required.",
        );
      }

      const body =
        await readJsonBody<
          PasswordRequest
        >(request, 8 * 1024);

      const action =
        typeof body.action === "string"
          ? body.action
          : "";

      if (
        !(
          [
            "sign-up",
            "change-password",
            "reset-password",
          ] as string[]
        ).includes(action)
      ) {
        throw new SafeHttpError(
          400,
          "unsupported_action",
          "The requested password action is not supported.",
        );
      }

      const payload =
        body.payload &&
        typeof body.payload ===
          "object"
          ? (body.payload as PasswordPayload)
          : {};

      if (action === "sign-up") {
        await enforceRateLimit({
          request,
          functionName:
            "manage-password-sign-up",
          limit: 8,
          windowSeconds: 3600,
        });

        const email =
          normalizeEmail(
            payload.email,
          );

        const password =
          validatePassword(
            payload.password,
          );

        const emailRedirectTo =
          normalizeSignupRedirect(
            request,
            payload.emailRedirectTo,
          );

        const anon =
          createAnonClient();

        const { data, error } =
          await anon.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo,
            },
          });

        if (error) {
          throw mapSignupError(error);
        }

        logSecurityEvent(
          "info",
          "server_password_signup_completed",
          {
            requestId,
            userId:
              data.user?.id || null,
            confirmationRequired:
              !data.session,
          },
        );

        return jsonResponse(
          request,
          {
            success: true,
            confirmationRequired:
              !data.session,
            user: data.user
              ? {
                  id: data.user.id,
                  email:
                    data.user.email ||
                    null,
                }
              : null,
            session: data.session
              ? {
                  accessToken:
                    data.session
                      .access_token,
                  refreshToken:
                    data.session
                      .refresh_token,
                }
              : null,
          },
          200,
          requestId,
        );
      }

      const auth =
        await requireAuthenticatedUser(
          request,
        );

      await enforceRateLimit({
        request,
        functionName:
          `manage-password-${action}`,
        userId: auth.user.id,
        limit: 12,
        windowSeconds: 3600,
      });

      const newPassword =
        validatePassword(
          payload.newPassword,
        );

      if (
        action === "change-password"
      ) {
        const currentPassword =
          normalizeCurrentPassword(
            payload.currentPassword,
          );

        await updatePasswordThroughAuth({
          authorization:
            auth.authorization,
          password: newPassword,
          currentPassword,
        });
      } else {
        requireRecoveryAuthentication(
          auth.authorization,
        );

        await updatePasswordThroughAuth({
          authorization:
            auth.authorization,
          password: newPassword,
        });
      }

      logSecurityEvent(
        "info",
        "server_password_update_completed",
        {
          requestId,
          userId: auth.user.id,
          action,
        },
      );

      return jsonResponse(
        request,
        {
          success: true,
          action,
        },
        200,
        requestId,
      );
    } catch (error) {
      logSecurityEvent(
        "warn",
        "server_password_request_rejected",
        {
          requestId,
          code:
            error instanceof
            SafeHttpError
              ? error.code
              : "internal_error",
        },
      );

      return safeErrorResponse(
        request,
        error,
        requestId,
      );
    }
  },
);