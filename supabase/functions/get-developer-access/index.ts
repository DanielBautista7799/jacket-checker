import { requireDeveloper } from "../_shared/security/adminAccess.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import {
  jsonResponse,
  safeErrorResponse,
  SafeHttpError,
} from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";

type AccessRequest = {
  action?: unknown;
};

Deno.serve(async (request: Request): Promise<Response> => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) {
      throw new SafeHttpError(
        403,
        "origin_not_allowed",
        "This request origin is not allowed.",
      );
    }

    if (request.method !== "POST") {
      throw new SafeHttpError(405, "method_not_allowed", "POST is required.");
    }

    const access = await requireDeveloper(request);
    await enforceRateLimit({
      request,
      functionName: "get-developer-access",
      userId: access.user.id,
      limit: 120,
      windowSeconds: 3600,
    });

    const body = await readJsonBody<AccessRequest>(request, 4 * 1024);
    const action = typeof body.action === "string" ? body.action : "check";

    if (action !== "check") {
      throw new SafeHttpError(
        400,
        "unsupported_action",
        "The requested developer-access action is not supported.",
      );
    }

    return jsonResponse(
      request,
      {
        success: true,
        authorized: true,
        role: access.role,
        source: access.source,
        needsBootstrap: access.needsBootstrap,
        canManageAccess: access.canManageAccess,
        pages: ["access", "scoring", "trends", "analytics"],
      },
      200,
      requestId,
    );
  } catch (error) {
    logSecurityEvent("warn", "developer_access_check_rejected", {
      requestId,
      code: error instanceof SafeHttpError ? error.code : "internal_error",
    });
    return safeErrorResponse(request, error, requestId);
  }
});
