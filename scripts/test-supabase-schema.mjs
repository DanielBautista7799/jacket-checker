import fs from "node:fs";

const required = [
  "supabase/migrations/20260623040000_security_reliability_hardening.sql",
  "supabase/verification/phase13_rls_audit.sql",
  "supabase/verification/phase13_storage_audit.sql",
  "supabase/verification/phase13_verify.sql",
  "supabase/functions/delete-account/index.ts",
  "supabase/functions/_shared/security/auth.ts",
  "supabase/functions/_shared/security/rateLimit.ts",
  "supabase/migrations/20260625020000_create_developer_access_registry.sql",
  "supabase/functions/manage-developer-access/index.ts",
  "supabase/functions/manage-password/index.ts",
  "supabase/functions/_shared/security/passwordPolicy.ts",
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Missing Phase 13 Supabase files:\n" + missing.join("\n"));
  process.exit(1);
}
const migration = fs.readFileSync(required[0], "utf8");
for (const token of ["edge_rate_limits", "consume_edge_rate_limit", "enable row level security", "wardrobe_item_images_one_primary_idx"]) {
  if (!migration.toLowerCase().includes(token.toLowerCase())) {
    console.error(`Phase 13 migration is missing ${token}`);
    process.exit(1);
  }
}
const registryMigration = fs.readFileSync("supabase/migrations/20260625020000_create_developer_access_registry.sql", "utf8").toLowerCase();
for (const token of ["developer_access_registry", "developer_access_audit", "bootstrap_developer_owner", "grant_developer_admin", "revoke_developer_admin"]) {
  if (!registryMigration.includes(token)) {
    console.error(`Developer access migration is missing ${token}`);
    process.exit(1);
  }
}
console.log("Supabase schema contract audit passed.");
