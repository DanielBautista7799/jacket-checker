import {
  requireDeveloper,
  requireDeveloperOwner,
  type DeveloperAuthContext,
} from "../_shared/security/adminAccess.ts";
import { createServiceClient } from "../_shared/security/auth.ts";
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

type AccessAction = "list" | "bootstrap" | "grant" | "revoke";

type AccessRequest = {
  action?: unknown;
  payload?: unknown;
};

type AccessPayload = {
  email?: unknown;
  targetUserId?: unknown;
  notes?: unknown;
};

type RegistryRow = {
  user_id: string;
  email_snapshot: string;
  role: "owner" | "admin";
  active: boolean;
  granted_by: string | null;
  granted_at: string;
  revoked_by: string | null;
  revoked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AuditRow = {
  id: number;
  action: "bootstrap_owner" | "grant" | "reactivate" | "revoke";
  actor_user_id: string | null;
  actor_email_snapshot: string | null;
  target_user_id: string | null;
  target_email_snapshot: string;
  previous_role: "owner" | "admin" | null;
  new_role: "owner" | "admin" | null;
  notes: string | null;
  request_id: string | null;
  created_at: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ADMIN_LIST_PAGES = 10;
const ADMIN_LIST_PAGE_SIZE = 200;

function normalizeEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    throw new SafeHttpError(
      400,
      "invalid_email",
      "Enter the exact email address of an existing Supabase Auth user.",
    );
  }
  return email;
}

function normalizeNotes(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new SafeHttpError(400, "invalid_notes", "Notes must be text.");
  }
  const notes = value.trim();
  if (!notes) return null;
  if (notes.length > 500) {
    throw new SafeHttpError(
      400,
      "invalid_notes",
      "Notes cannot exceed 500 characters.",
    );
  }
  return notes;
}

function normalizeTargetUserId(value: unknown): string {
  const userId = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(userId)) {
    throw new SafeHttpError(
      400,
      "invalid_target_user",
      "The selected developer account is invalid.",
    );
  }
  return userId;
}

function mapRegistryError(error: { message?: string } | null): SafeHttpError {
  const message = String(error?.message || "");
  if (message.includes("developer_registry_initialized")) {
    return new SafeHttpError(
      409,
      "developer_registry_initialized",
      "Developer access has already been initialized.",
    );
  }
  if (message.includes("developer_owner_required")) {
    return new SafeHttpError(
      403,
      "developer_owner_required",
      "Owner access is required for this action.",
    );
  }
  if (message.includes("developer_already_active")) {
    return new SafeHttpError(
      409,
      "developer_already_active",
      "That account already has active developer access.",
    );
  }
  if (message.includes("developer_not_active")) {
    return new SafeHttpError(
      409,
      "developer_not_active",
      "That account does not currently have active developer access.",
    );
  }
  if (
    message.includes("cannot_revoke_self") ||
    message.includes("cannot_revoke_owner") ||
    message.includes("cannot_change_owner") ||
    message.includes("cannot_grant_owner_account")
  ) {
    return new SafeHttpError(
      409,
      "owner_protected",
      "The owner account cannot be changed by this action.",
    );
  }
  if (message.includes("invalid_developer_access_input")) {
    return new SafeHttpError(
      400,
      "invalid_developer_access_input",
      "The developer-access request is invalid.",
    );
  }
  return new SafeHttpError(
    503,
    "developer_registry_update_failed",
    "Developer access could not be updated.",
  );
}

async function resolveAuthUserByEmail(email: string) {
  const service = createServiceClient();

  for (let page = 1; page <= MAX_ADMIN_LIST_PAGES; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: ADMIN_LIST_PAGE_SIZE,
    });

    if (error) {
      throw new SafeHttpError(
        503,
        "auth_directory_unavailable",
        "The Auth user directory could not be searched.",
      );
    }

    const users = data?.users || [];
    const match = users.find(
      (user) => String(user.email || "").trim().toLowerCase() === email,
    );
    if (match) return match;
    if (users.length < ADMIN_LIST_PAGE_SIZE) break;
  }

  throw new SafeHttpError(
    404,
    "auth_user_not_found",
    "No existing Supabase Auth user was found with that email address.",
  );
}

async function resolveCurrentEmails(userIds: string[]): Promise<Map<string, string>> {
  const service = createServiceClient();
  const entries = await Promise.all(
    [...new Set(userIds.filter(Boolean))].map(async (userId) => {
      const { data, error } = await service.auth.admin.getUserById(userId);
      if (error || !data?.user?.email) return [userId, ""] as const;
      return [userId, data.user.email.trim().toLowerCase()] as const;
    }),
  );
  return new Map(entries);
}

async function buildAccessSnapshot(access: DeveloperAuthContext) {
  const service = createServiceClient();
  const [{ data: registry, error: registryError }, { data: audit, error: auditError }] =
    await Promise.all([
      service
        .from("developer_access_registry")
        .select(
          "user_id,email_snapshot,role,active,granted_by,granted_at,revoked_by,revoked_at,notes,created_at,updated_at",
        )
        .order("active", { ascending: false })
        .order("role", { ascending: false })
        .order("granted_at", { ascending: false })
        .limit(200),
      service
        .from("developer_access_audit")
        .select(
          "id,action,actor_user_id,actor_email_snapshot,target_user_id,target_email_snapshot,previous_role,new_role,notes,request_id,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (registryError || auditError) {
    throw new SafeHttpError(
      503,
      "developer_registry_unavailable",
      "The developer access registry could not be loaded.",
    );
  }

  const rows = (registry || []) as RegistryRow[];
  const uniqueIds = rows.flatMap((row) => [row.user_id, row.granted_by || "", row.revoked_by || ""]);
  const currentEmails = await resolveCurrentEmails(uniqueIds);

  return {
    access: {
      role: access.role,
      source: access.source,
      needsBootstrap: access.needsBootstrap,
      canManageAccess: access.canManageAccess,
    },
    roster: rows.map((row) => {
      const currentEmail = currentEmails.get(row.user_id) || row.email_snapshot;
      return {
        userId: row.user_id,
        email: currentEmail,
        emailSnapshot: row.email_snapshot,
        emailChanged: Boolean(currentEmail && currentEmail !== row.email_snapshot),
        role: row.role,
        active: row.active,
        grantedAt: row.granted_at,
        grantedByEmail: row.granted_by
          ? currentEmails.get(row.granted_by) || null
          : null,
        revokedAt: row.revoked_at,
        revokedByEmail: row.revoked_by
          ? currentEmails.get(row.revoked_by) || null
          : null,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
    audit: ((audit || []) as AuditRow[]).map((row) => ({
      id: row.id,
      action: row.action,
      actorUserId: row.actor_user_id,
      actorEmail: row.actor_email_snapshot,
      targetUserId: row.target_user_id,
      targetEmail: row.target_email_snapshot,
      previousRole: row.previous_role,
      newRole: row.new_role,
      notes: row.notes,
      requestId: row.request_id,
      createdAt: row.created_at,
    })),
  };
}

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

    const body = await readJsonBody<AccessRequest>(request, 12 * 1024);
    const action = typeof body.action === "string" ? body.action : "list";
    if (!["list", "bootstrap", "grant", "revoke"].includes(action)) {
      throw new SafeHttpError(
        400,
        "unsupported_action",
        "The requested developer-access action is not supported.",
      );
    }

    const access = await requireDeveloper(request);
    await enforceRateLimit({
      request,
      functionName: "manage-developer-access",
      userId: access.user.id,
      limit: action === "list" ? 120 : 30,
      windowSeconds: 3600,
    });

    const payload =
      body.payload && typeof body.payload === "object"
        ? (body.payload as AccessPayload)
        : {};
    const service = createServiceClient();

    if (action === "bootstrap") {
      if (!access.needsBootstrap || access.source !== "legacy_secret") {
        throw new SafeHttpError(
          409,
          "bootstrap_not_available",
          "Developer access has already been initialized.",
        );
      }

      const { error } = await service.rpc("bootstrap_developer_owner", {
        p_user_id: access.user.id,
        p_email: String(access.user.email || "").trim().toLowerCase(),
        p_request_id: requestId,
        p_notes: "Migrated from the legacy Supabase secret allowlist.",
      });
      if (error) throw mapRegistryError(error);

      logSecurityEvent("info", "developer_owner_bootstrapped", {
        requestId,
        actorUserId: access.user.id,
      });

      const refreshed = await requireDeveloper(request);
      return jsonResponse(
        request,
        { success: true, ...(await buildAccessSnapshot(refreshed)) },
        200,
        requestId,
      );
    }

    if (action === "grant") {
      const owner = await requireDeveloperOwner(request);
      const email = normalizeEmail(payload.email);
      const notes = normalizeNotes(payload.notes);
      const target = await resolveAuthUserByEmail(email);

      const { error } = await service.rpc("grant_developer_admin", {
        p_actor_user_id: owner.user.id,
        p_actor_email: String(owner.user.email || "").trim().toLowerCase(),
        p_target_user_id: target.id,
        p_target_email: email,
        p_notes: notes,
        p_request_id: requestId,
      });
      if (error) throw mapRegistryError(error);

      logSecurityEvent("info", "developer_access_granted", {
        requestId,
        actorUserId: owner.user.id,
        targetUserId: target.id,
      });
    }

    if (action === "revoke") {
      const owner = await requireDeveloperOwner(request);
      const targetUserId = normalizeTargetUserId(payload.targetUserId);
      const notes = normalizeNotes(payload.notes);

      const { error } = await service.rpc("revoke_developer_admin", {
        p_actor_user_id: owner.user.id,
        p_actor_email: String(owner.user.email || "").trim().toLowerCase(),
        p_target_user_id: targetUserId,
        p_notes: notes,
        p_request_id: requestId,
      });
      if (error) throw mapRegistryError(error);

      logSecurityEvent("info", "developer_access_revoked", {
        requestId,
        actorUserId: owner.user.id,
        targetUserId,
      });
    }

    const currentAccess = await requireDeveloper(request);
    return jsonResponse(
      request,
      { success: true, ...(await buildAccessSnapshot(currentAccess)) },
      200,
      requestId,
    );
  } catch (error) {
    logSecurityEvent("warn", "developer_access_management_rejected", {
      requestId,
      code: error instanceof SafeHttpError ? error.code : "internal_error",
    });
    return safeErrorResponse(request, error, requestId);
  }
});
