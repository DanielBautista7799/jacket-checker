import { createServiceClient, requireAuthenticatedUser } from "./auth.ts";
import { SafeHttpError } from "./safeError.ts";

export type DeveloperRole = "owner" | "admin";
export type DeveloperAccessSource = "registry" | "legacy_secret";

export type DeveloperAuthContext = Awaited<
  ReturnType<typeof requireAuthenticatedUser>
> & {
  role: DeveloperRole;
  source: DeveloperAccessSource;
  needsBootstrap: boolean;
  canManageAccess: boolean;
};

function configuredValues(name: string): Set<string> {
  return new Set(
    String(Deno.env.get(name) || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function legacyAllowlistMatches(userId: string, email?: string | null): boolean {
  const ids = new Set([
    ...configuredValues("DEVELOPER_USER_IDS"),
    ...configuredValues("TREND_ADMIN_USER_IDS"),
  ]);
  const emails = new Set([
    ...configuredValues("DEVELOPER_EMAILS"),
    ...configuredValues("TREND_ADMIN_EMAILS"),
  ]);

  return (
    ids.has(userId.toLowerCase()) ||
    emails.has(String(email || "").trim().toLowerCase())
  );
}

function isMissingRegistryError(error: { code?: string } | null): boolean {
  return ["42P01", "PGRST204", "PGRST205"].includes(String(error?.code || ""));
}

export async function requireDeveloper(
  request: Request,
): Promise<DeveloperAuthContext> {
  const auth = await requireAuthenticatedUser(request);
  const service = createServiceClient();

  const { data: registryEntry, error: entryError } = await service
    .from("developer_access_registry")
    .select("role, active")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!entryError && registryEntry?.active === true) {
    const role: DeveloperRole = registryEntry.role === "owner" ? "owner" : "admin";
    return {
      ...auth,
      role,
      source: "registry",
      needsBootstrap: false,
      canManageAccess: role === "owner",
    };
  }

  if (entryError && !isMissingRegistryError(entryError)) {
    throw new SafeHttpError(
      503,
      "developer_registry_unavailable",
      "Developer access could not be verified.",
    );
  }

  const { count: activeCount, error: countError } = await service
    .from("developer_access_registry")
    .select("user_id", { count: "exact", head: true })
    .eq("active", true);

  if (countError && !isMissingRegistryError(countError)) {
    throw new SafeHttpError(
      503,
      "developer_registry_unavailable",
      "Developer access could not be verified.",
    );
  }

  const registryHasActiveAccounts = !countError && Number(activeCount || 0) > 0;
  if (registryHasActiveAccounts) {
    throw new SafeHttpError(
      403,
      "forbidden",
      "Developer access is not enabled for this account.",
    );
  }

  if (!legacyAllowlistMatches(auth.user.id, auth.user.email)) {
    throw new SafeHttpError(
      403,
      "forbidden",
      "Developer access is not enabled for this account.",
    );
  }

  return {
    ...auth,
    role: "owner",
    source: "legacy_secret",
    needsBootstrap: true,
    canManageAccess: false,
  };
}

export async function requireDeveloperOwner(
  request: Request,
): Promise<DeveloperAuthContext> {
  const access = await requireDeveloper(request);

  if (access.source !== "registry" || access.role !== "owner") {
    throw new SafeHttpError(
      403,
      "developer_owner_required",
      "Owner access is required for this action.",
    );
  }

  return access;
}
