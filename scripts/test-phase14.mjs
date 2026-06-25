import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const requiredFiles = [
  ".env.example",
  ".nvmrc",
  "netlify.toml",
  "public/_headers",
  "public/_redirects",
  "playwright.production.config.js",
  "tests/e2e/production-smoke.spec.js",
  "scripts/verify-production-config.mjs",
  "scripts/check-production-build.mjs",
  "supabase/verification/phase14_production_verify.sql",
  "docs/CURRENT_STATE_AUDIT.md",
  "docs/ARCHITECTURE.md",
  "docs/PRODUCTION_ENVIRONMENT.md",
  "docs/DEPLOYMENT.md",
  "docs/PRODUCTION_TEST_CHECKLIST.md",
  "docs/INCIDENT_RESPONSE.md",
  "docs/KNOWN_LIMITATIONS.md",
  "docs/SECURITY_OVERVIEW.md",
  "docs/DEVELOPER_ACCESS.md",
  "docs/PHASE14_LIVE_TEST_RESULTS.md",
  "src/components/ThemeToggle.jsx",
  "src/context/ThemeContext.jsx",
  "src/hooks/useTheme.js",
  "src/utils/theme.js",
  "tests/components/ThemeToggle.test.jsx",
  "tests/unit/theme.test.js",
  "src/components/DeveloperRoute.jsx",
  "src/components/DeveloperNav.jsx",
  "src/context/DeveloperAccessContext.jsx",
  "src/hooks/useDeveloperAccess.js",
  "supabase/functions/get-developer-access/index.ts",
  "supabase/functions/get-developer-access/deno.json",
  "supabase/functions/manage-developer-access/index.ts",
  "supabase/functions/manage-developer-access/deno.json",
  "supabase/migrations/20260625020000_create_developer_access_registry.sql",
  "supabase/verification/developer_access_registry_verify.sql",
  "src/pages/DeveloperAccessPage.jsx",
  "supabase/functions/manage-password/index.ts",
  "supabase/functions/manage-password/deno.json",
  "supabase/functions/_shared/security/passwordPolicy.ts",
  "src/utils/passwordSecurityApi.js",
  "scripts/configure-hosted-password-policy.mjs",
  "scripts/test-password-security.mjs",
];

test("all Phase 14 files exist", () => {
  for (const file of requiredFiles) assert(exists(file), `Missing ${file}`);
});

test("the production host is configured for Vite and dist", () => {
  const source = read("netlify.toml");
  assert(source.includes('command = "npm run build"'), "Netlify build command is incorrect");
  assert(source.includes('publish = "dist"'), "Netlify publish directory is incorrect");
  assert(!source.includes("VITE_SUPABASE_URL ="), "Supabase values must not be committed to netlify.toml");
});

test("React deep links use an SPA rewrite", () => {
  assert(/^\/\*\s+\/index\.html\s+200\s*$/m.test(read("public/_redirects")), "SPA rewrite is missing");
});

test("production headers retain security and cache controls", () => {
  const source = read("public/_headers");
  for (const value of ["Content-Security-Policy", "frame-ancestors 'none'", "X-Content-Type-Options: nosniff", "Strict-Transport-Security", "/assets/*", "immutable"]) {
    assert(source.includes(value), `Missing header requirement: ${value}`);
  }
});

test("only browser-safe Vite variables are documented", () => {
  const source = read(".env.example");
  assert(source.includes("VITE_SUPABASE_URL"), "Supabase URL example is missing");
  assert(source.includes("VITE_SUPABASE_ANON_KEY"), "Supabase browser key example is missing");
  for (const forbidden of ["SERVICE_ROLE", "GEMINI_API_KEY", "OPENAI_API_KEY", "WEATHER_API_KEY", "RATE_LIMIT_SALT", "VITE_ENABLE_DEV_"]) {
    assert(!source.includes(forbidden), `.env.example exposes or documents ${forbidden}`);
  }
});

test("package scripts contain the complete predeployment gate", () => {
  const scripts = JSON.parse(read("package.json")).scripts;
  for (const name of ["test:phase14", "test:password-security", "security:password-policy:configure", "security:password-policy:verify", "test:production-config", "test:production-config:strict", "test:production-build", "test:production-smoke", "test:predeploy"]) {
    assert(scripts?.[name], `Missing package script ${name}`);
  }
  assert(scripts["test:all"].includes("test:phase14"), "test:all must include Phase 14");
  assert(scripts["test:all"].includes("test:password-security"), "test:all must include password security checks");
  assert(scripts["test:predeploy"].includes("test:e2e"), "Final predeployment gate must include local browser tests");
});

test("production smoke tests use an explicit HTTPS base URL", () => {
  const config = read("playwright.production.config.js");
  assert(config.includes("PRODUCTION_BASE_URL"), "Production URL environment variable is missing");
  assert(config.includes('protocol !== "https:"'), "Production smoke config must enforce HTTPS");
});

test("production smoke coverage includes public, protected, deep-link, and optional auth checks", () => {
  const source = read("tests/e2e/production-smoke.spec.js");
  for (const value of ["security headers", "protected routes", "deep links", "guest jacket check", "RUN_AUTHENTICATED_SMOKE"]) {
    assert(source.includes(value), `Missing smoke-test coverage: ${value}`);
  }
});

test("production SQL verification is read-only", () => {
  const source = read("supabase/verification/phase14_production_verify.sql").toLowerCase();
  for (const forbidden of ["insert into", "update ", "delete from", "alter table", "drop table", "create table", "truncate "]) {
    assert(!source.includes(forbidden), `Production verification SQL must not contain ${forbidden.trim()}`);
  }
  assert(source.includes("to_regclass"), "Production verification must inspect required tables safely");
});

test("documentation keeps deployment pending and preserves MVP scope", () => {
  const readme = read("README.md");
  const live = read("docs/PHASE14_LIVE_TEST_RESULTS.md");
  assert(readme.includes("Deployment status: pending"), "README must not claim deployment is complete");
  assert(live.includes("NOT RUN"), "Live results must remain explicitly not run before deployment");
  for (const forbidden of ["includes retailer recommendations", "includes affiliate links", "automatic background removal is included"]) {
    assert(!readme.toLowerCase().includes(forbidden), `README claims excluded scope: ${forbidden}`);
  }
});


test("developer routes are server-gated and admin navigation is conditional", () => {
  const app = read("src/App.jsx");
  const header = read("src/components/AppHeader.jsx");
  const route = read("src/components/DeveloperRoute.jsx");
  const accessFunction = read("supabase/functions/get-developer-access/index.ts");

  assert(app.includes("DeveloperAccessProvider"), "Developer access provider is missing");
  assert(app.includes("DeveloperRoute"), "Developer pages must use the secure route guard");
  assert(!app.includes("VITE_ENABLE_DEV_"), "Legacy client developer flags must be removed");
  assert(header.includes("isDeveloper &&"), "Developer dropdown entry must be conditional");
  assert(header.includes("Developer tools"), "Approved administrators need a dropdown entry");
  assert(route.includes('to="/app" replace'), "Unapproved accounts must be redirected");
  assert(accessFunction.includes("requireDeveloper"), "Access check must enforce server authorization");
  assert(app.includes('path="/dev/access"'), "Developer access route is missing");
  assert(header.includes('to="/dev/access"'), "Developer tools should open the access registry");
});



test("developer registry is documented and deployment-ready", () => {
  const docs = read("docs/DEVELOPER_ACCESS.md");
  const config = read("supabase/config.toml");
  const migration = read("supabase/migrations/20260625020000_create_developer_access_registry.sql");
  assert(docs.includes("Initialize owner registry"), "Owner bootstrap instructions are missing");
  assert(docs.includes("developer_access_registry"), "Registry documentation is missing");
  assert(config.includes("[functions.manage-developer-access]"), "Management function is not configured");
  assert(migration.includes("bootstrap_developer_owner"), "Owner bootstrap RPC is missing");
  assert(migration.includes("grant_developer_admin"), "Admin grant RPC is missing");
  assert(migration.includes("revoke_developer_admin"), "Admin revoke RPC is missing");
});


test("password policy is server-enforced and deployment-ready", () => {
  const config = read("supabase/config.toml");
  const server = read("supabase/functions/manage-password/index.ts");
  const policyScript = read("scripts/configure-hosted-password-policy.mjs");
  assert(config.includes("[functions.manage-password]"), "Password management function is not configured");
  assert(server.includes("validatePassword"), "Password management function must validate passwords");
  assert(server.includes("requireRecoveryAuthentication"), "Recovery changes must verify recovery authentication");
  assert(policyScript.includes("password_min_length: 6"), "Hosted password minimum is not configured");
  assert(policyScript.includes("lower_upper_letters_digits_symbols"), "Hosted required characters are not configured");
});

test("verified missing UI dependencies are supplied as complete files", () => {
  assert(exists("src/components/ui/Alert.jsx"), "Alert.jsx is missing");
  assert(exists("src/components/ui/ErrorState.jsx"), "ErrorState.jsx is missing");
  assert(read("src/components/ui/Alert.jsx").includes("export default function Alert"), "Alert.jsx is incomplete");
  assert(read("src/components/ui/ErrorState.jsx").includes("export default function ErrorState"), "ErrorState.jsx is incomplete");
  assert(read("src/components/ThemeToggle.jsx").includes("Switch to ${nextTheme} mode"), "ThemeToggle.jsx is incomplete");
  assert(read("src/styles/tokens.css").includes('[data-theme="light"]'), "Light theme tokens are missing");
  assert(read("src/styles/tokens.css").includes('[data-theme="dark"]'), "Dark theme tokens are missing");
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
console.log(`\n${passed}/${tests.length} Phase 14 tests passed.`);
if (passed !== tests.length) process.exit(1);
