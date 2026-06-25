import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const edgeFunctions = [
  "get-weather",
  "analyze-closet-item",
  "analyze-wardrobe-item",
  "generate-jacket-embedding",
  "sync-style-trends",
  "track-analytics",
  "get-analytics-dashboard",
  "get-developer-access",
  "manage-developer-access",
  "manage-password",
  "delete-account",
];

test("shared Edge Function security modules exist", () => {
  for (const name of [
    "cors",
    "auth",
    "adminAccess",
    "requestId",
    "rateLimit",
    "validateJsonBody",
    "safeError",
    "securityHeaders",
    "logSecurityEvent",
    "passwordPolicy",
  ]) {
    assert(
      exists(`supabase/functions/_shared/security/${name}.ts`),
      `Missing shared security module ${name}.ts`,
    );
  }
});

test("every active Edge Function uses shared CORS and request IDs", () => {
  for (const name of edgeFunctions) {
    const source = read(`supabase/functions/${name}/index.ts`);
    assert(source.includes("handleCorsPreflight"), `${name} is missing shared preflight handling`);
    assert(source.includes("getRequestId"), `${name} is missing request IDs`);
    assert(source.includes("safeErrorResponse"), `${name} is missing safe error responses`);
  }
});

test("authenticated and developer functions enforce access", () => {
  for (const name of [
    "analyze-closet-item",
    "analyze-wardrobe-item",
    "generate-jacket-embedding",
    "delete-account",
    "manage-password",
  ]) {
    assert(
      read(`supabase/functions/${name}/index.ts`).includes("requireAuthenticatedUser"),
      `${name} must require a user`,
    );
  }

  for (const name of [
    "sync-style-trends",
    "get-analytics-dashboard",
    "get-developer-access",
    "manage-developer-access",
  ]) {
    assert(
      read(`supabase/functions/${name}/index.ts`).includes("requireDeveloper"),
      `${name} must require developer access`,
    );
  }
});


test("developer pages use server-enforced authorization", () => {
  const app = read("src/App.jsx");
  const route = read("src/components/DeveloperRoute.jsx");
  const accessContext = read("src/context/DeveloperAccessContext.jsx");
  const accessFunction = read("supabase/functions/get-developer-access/index.ts");

  assert(app.includes("DeveloperAccessProvider"), "Developer access provider is missing");
  assert(app.includes("DeveloperRoute"), "Developer routes must use the secure route guard");
  assert(!app.includes("VITE_ENABLE_DEV_"), "Client-side developer feature flags must be removed");
  assert(route.includes("isDeveloper"), "Developer route must require verified access");
  assert(
    accessContext.includes('"get-developer-access"'),
    "Frontend must verify access through the Edge Function",
  );
  assert(
    accessFunction.includes("requireDeveloper"),
    "Developer access Edge Function must require the server allowlist",
  );
});



test("developer access registry is server-only and audited", () => {
  const migration = read(
    "supabase/migrations/20260625020000_create_developer_access_registry.sql",
  ).toLowerCase();
  const access = read("supabase/functions/_shared/security/adminAccess.ts");
  const manager = read("supabase/functions/manage-developer-access/index.ts");

  assert(migration.includes("developer_access_registry"), "Developer registry table is missing");
  assert(migration.includes("developer_access_audit"), "Developer audit table is missing");
  assert(migration.includes("enable row level security"), "Developer tables must use RLS");
  assert(
    migration.includes("revoke all on table public.developer_access_registry from anon, authenticated"),
    "Browser roles must not have registry access",
  );
  assert(migration.includes("append_only"), "Audit rows must be append-only");
  assert(migration.includes("active_developer_owner_cannot_be_deleted"), "Active owner deletion must be blocked");
  assert(migration.includes("pg_advisory_xact_lock"), "Owner bootstrap must be concurrency-safe");
  assert(access.includes("registryHasActiveAccounts"), "Registry must disable secret fallback after bootstrap");
  assert(manager.includes("requireDeveloperOwner"), "Access changes must require the owner role");
  assert(manager.includes("auth.admin.listUsers"), "Grants must resolve existing Auth users server-side");
});


test("password mutations are server-enforced", () => {
  const authPanel = read("src/components/AuthPanel.jsx");
  const accountSecurity = read("src/components/AccountSecurityPanel.jsx");
  const resetPage = read("src/pages/ResetPasswordPage.jsx");
  const api = read("src/utils/passwordSecurityApi.js");
  const server = read("supabase/functions/manage-password/index.ts");
  const policy = read("supabase/functions/_shared/security/passwordPolicy.ts");

  assert(authPanel.includes("signUpWithServerPasswordPolicy"), "Signup must use the password Edge Function");
  assert(accountSecurity.includes("changePasswordWithServerPolicy"), "Password changes must use the password Edge Function");
  assert(resetPage.includes("resetPasswordWithServerPolicy"), "Password resets must use the password Edge Function");
  assert(api.includes('"manage-password"'), "Client password API must invoke manage-password");
  assert(server.includes("requireAuthenticatedUser"), "Protected password actions must authenticate the caller");
  assert(server.includes("requireRecoveryAuthentication"), "Password reset must require a recovery session");
  assert(server.includes("current_password"), "Signed-in password changes must verify the current password");
  assert(policy.includes("PASSWORD_MIN_LENGTH = 6"), "Server minimum password length must be six");
});

test("server rate limiting stores only hashed scopes", () => {
  const migration = read(
    "supabase/migrations/20260623040000_security_reliability_hardening.sql",
  ).toLowerCase();

  assert(migration.includes("edge_rate_limits"), "Rate-limit table is missing");
  assert(migration.includes("scope_hash"), "Hashed scope column is missing");
  assert(!migration.includes("ip_address"), "Raw IP address column must not exist");
  assert(migration.includes("consume_edge_rate_limit"), "Atomic rate-limit RPC is missing");
});

test("account deletion derives the user from authentication and hard deletes", () => {
  const source = read("supabase/functions/delete-account/index.ts");
  assert(source.includes("requireAuthenticatedUser"), "Account deletion must authenticate the caller");
  assert(source.includes("DELETE MY ACCOUNT"), "Exact confirmation phrase is required");
  assert(source.includes("deleteUser(user.id, false)"), "The authenticated account must be hard-deleted");
  assert(
    !source.includes("body.userId") && !source.includes("body.user_id"),
    "Client-supplied user IDs must be ignored",
  );
});

test("upload validation accepts only supported raster images", () => {
  const config = read("src/config/uploadSecurityConfig.js");
  const validator = read("src/utils/validateJacketImageFile.js");

  assert(
    config.includes('"image/jpeg"') &&
      config.includes('"image/png"') &&
      config.includes('"image/webp"'),
    "JPEG, PNG, and WebP must be allowed",
  );
  assert(!config.includes('"image/svg+xml"'), "SVG must not be allowed");
  assert(
    validator.includes("maxBytes") &&
      validator.includes("maxWidth") &&
      validator.includes("minWidth"),
    "Size and dimension validation must be enforced",
  );
});

test("upload filenames are sanitized", () => {
  const source = read("src/utils/sanitizeUploadFilename.js");
  assert(source.includes('normalize("NFKD")'), "Unicode filenames should be normalized");
  assert(
    source.includes("replace(/[^a-zA-Z0-9_-]+/g"),
    "Unsafe filename characters must be replaced",
  );
  assert(source.includes("MAX_BASENAME_LENGTH"), "Filename length must be bounded");
});

test("client errors are classified without exposing raw stacks", () => {
  const classifier = read("src/utils/classifyAppError.js");
  const safeSource = read("src/utils/safeClientError.js");
  assert(
    classifier.includes("status === 429") && classifier.includes('"rate_limit"'),
    "429 should be classified as rate limited",
  );
  assert(!safeSource.includes("error.stack"), "Safe client errors must not expose stack traces");
});

test("offline state is present and non-destructive", () => {
  const banner = read("src/components/OfflineBanner.jsx");
  const context = read("src/context/NetworkStatusContext.jsx");
  assert(banner.includes('aria-live="polite"'), "Offline status should be announced");
  assert(
    context.includes('addEventListener("online"') &&
      context.includes('addEventListener("offline"'),
    "Network transitions must be observed",
  );
});

test("authentication uses one shared Supabase client", () => {
  const client = read("src/lib/supabaseClient.js");
  assert(
    client.includes("globalThis.__jacketCheckSupabaseClient"),
    "Supabase client should be singleton-scoped",
  );
  assert(client.includes("autoRefreshToken: true"), "Session refresh must remain enabled");
});

test("signed image handling deduplicates signing requests", () => {
  const storage = read("src/utils/wardrobeImageStorage.js");
  assert(storage.includes("signedUrlPromises"), "Signed URL requests should be deduplicated");
  assert(storage.includes("createSignedUrl"), "Private images should use signed URLs");
  assert(!storage.includes("getPublicUrl"), "Private jacket images must not use public URLs");
});

test("security headers include CSP and anti-framing controls", () => {
  const headers = read("public/_headers");
  assert(headers.includes("Content-Security-Policy"), "CSP is missing");
  assert(headers.includes("frame-ancestors 'none'"), "Frame protection is missing");
  assert(
    headers.includes("X-Content-Type-Options: nosniff"),
    "MIME sniffing protection is missing",
  );
});

test("frontend security audit checks unsafe HTML rendering", () => {
  const audit = read("scripts/audit-project-security.mjs");
  assert(
    audit.includes("dangerouslySetInnerHTML"),
    "Security audit must scan for unsafe HTML rendering",
  );
});

test("RLS and Storage verification scripts exist", () => {
  for (const file of [
    "phase13_rls_audit.sql",
    "phase13_storage_audit.sql",
    "phase13_verify.sql",
  ]) {
    assert(exists(`supabase/verification/${file}`), `Missing ${file}`);
  }
});

test("the Phase 13 migration preserves legacy non-jacket rows", () => {
  const migration = read(
    "supabase/migrations/20260623040000_security_reliability_hardening.sql",
  );
  assert(migration.includes("not valid"), "Jacket-only constraint should preserve legacy rows");
  assert(
    !migration.includes("delete from public.wardrobe_items"),
    "Legacy wardrobe rows must not be deleted",
  );
});

test("all required security and QA package scripts exist", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const name of [
    "test:unit",
    "test:e2e",
    "test:security",
    "test:phase13",
    "test:all",
  ]) {
    assert(pkg.scripts?.[name], `Missing package script ${name}`);
  }
});

test("removed product scopes did not return", () => {
  const sourceFiles = fs.readdirSync(path.join(root, "src/utils"));
  const componentFiles = fs
    .readdirSync(path.join(root, "src/components"))
    .join(" ")
    .toLowerCase();

  assert(
    !sourceFiles.includes("generateWardrobeOutfit.js"),
    "Full wardrobe outfit generation returned",
  );
  assert(!sourceFiles.includes("outfitColorRules.js"), "Full wardrobe color rules returned");
  assert(!componentFiles.includes("shopping"), "Shopping components must not exist");
  assert(!componentFiles.includes("backgroundremoval"), "Background removal must not return");
});

let passed = 0;
for (const current of tests) {
  try {
    await current.fn();
    console.log(`✓ ${current.name}`);
    passed += 1;
  } catch (error) {
    console.error(`✗ ${current.name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\n${passed}/${tests.length} Phase 13 tests passed.`);
if (passed !== tests.length) process.exit(1);
