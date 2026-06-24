import { createServiceClient } from "../_shared/security/auth.ts";
import { requireAuthenticatedUser } from "../_shared/security/auth.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";

const BUCKET = "closet-images";
const CONFIRMATION = "DELETE MY ACCOUNT";

type StorageObject = { name: string; id?: string | null; metadata?: Record<string, unknown> | null };

async function listAllFiles(service: ReturnType<typeof createServiceClient>, prefix: string): Promise<string[]> {
  const files: string[] = [];
  const queue = [prefix];

  while (queue.length > 0) {
    const folder = queue.shift() as string;
    let offset = 0;
    while (true) {
      const { data, error } = await service.storage.from(BUCKET).list(folder, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new SafeHttpError(503, "storage_unavailable", "Private jacket images could not be removed. Try again.");
      const objects = (data || []) as StorageObject[];
      for (const object of objects) {
        const path = folder ? `${folder}/${object.name}` : object.name;
        const looksLikeFolder = !object.id && !object.metadata;
        if (looksLikeFolder) queue.push(path);
        else files.push(path);
      }
      if (objects.length < 100) break;
      offset += 100;
    }
  }

  return files;
}

Deno.serve(async (request: Request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const { user } = await requireAuthenticatedUser(request);
    await enforceRateLimit({ request, functionName: "delete-account", userId: user.id, limit: 3, windowSeconds: 3600 });
    const body = await readJsonBody<Record<string, unknown>>(request, 2048);
    if (String(body.confirmation || "").trim() !== CONFIRMATION) {
      throw new SafeHttpError(400, "confirmation_required", `Type ${CONFIRMATION} exactly to delete the account.`);
    }

    const service = createServiceClient();
    const imagePaths = await listAllFiles(service, user.id);
    for (let start = 0; start < imagePaths.length; start += 100) {
      const batch = imagePaths.slice(start, start + 100);
      const { error } = await service.storage.from(BUCKET).remove(batch);
      if (error) throw new SafeHttpError(503, "storage_cleanup_failed", "Private jacket images could not be removed. Try again.");
    }

    const { error: deleteError } = await service.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw new SafeHttpError(503, "account_delete_failed", "The account could not be deleted right now. Try again.");

    logSecurityEvent("info", "account_deleted", { requestId, userIdHash: user.id.slice(0, 8), imageCount: imagePaths.length });
    return jsonResponse(request, { success: true, deletedImageCount: imagePaths.length }, 200, requestId);
  } catch (error) {
    logSecurityEvent("warn", "account_delete_rejected", { requestId, code: error instanceof SafeHttpError ? error.code : "internal_error" });
    return safeErrorResponse(request, error, requestId);
  }
});
