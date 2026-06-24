import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const failures = [];
const warnings = [];

const REQUIRED_FILES = [
  ".env.example",
  ".nvmrc",
  "netlify.toml",
  "public/_headers",
  "public/_redirects",
  "vite.config.js",
  "package.json",
];

const ALLOWED_VITE_VARIABLES = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_ENABLE_DEV_SCORING",
  "VITE_ENABLE_DEV_TRENDS",
  "VITE_ENABLE_DEV_ANALYTICS",
]);

const FORBIDDEN_CLIENT_NAME = /(SERVICE_ROLE|SECRET|PASSWORD|PRIVATE|DATABASE|GEMINI|OPENAI|WEATHER_API_KEY|RATE_LIMIT_SALT)/i;
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const fileEnv = {};
for (const filename of ENV_FILES) {
  const full = path.join(root, filename);
  if (fs.existsSync(full)) Object.assign(fileEnv, parseEnv(fs.readFileSync(full, "utf8")));
}
const env = { ...fileEnv, ...process.env };

for (const relative of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing required production file: ${relative}`);
}

for (const [name] of Object.entries(fileEnv)) {
  if (name.startsWith("VITE_") && (!ALLOWED_VITE_VARIABLES.has(name) || FORBIDDEN_CLIENT_NAME.test(name))) {
    failures.push(`Disallowed browser environment variable: ${name}`);
  }
}

const supabaseUrl = String(env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = String(env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl) {
  failures.push("VITE_SUPABASE_URL is missing from the current environment or local env files.");
} else {
  try {
    const parsed = new URL(supabaseUrl);
    const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !local) failures.push("VITE_SUPABASE_URL must use HTTPS unless it points to local Supabase.");
    if (strict && local) failures.push("Strict production validation does not allow a localhost Supabase URL.");
    if (strict && !parsed.hostname.endsWith(".supabase.co")) warnings.push("Strict check: Supabase URL does not use the standard hosted supabase.co hostname.");
  } catch {
    failures.push("VITE_SUPABASE_URL is not a valid URL.");
  }
}

if (!supabaseKey) {
  failures.push("VITE_SUPABASE_ANON_KEY is missing from the current environment or local env files.");
} else if (/YOUR_|PLACEHOLDER|CHANGE_ME/i.test(supabaseKey)) {
  failures.push("VITE_SUPABASE_ANON_KEY still contains a placeholder value.");
}

for (const name of ["VITE_ENABLE_DEV_SCORING", "VITE_ENABLE_DEV_TRENDS", "VITE_ENABLE_DEV_ANALYTICS"]) {
  if (String(env[name] || "").toLowerCase() === "true") {
    const message = `${name} is enabled.`;
    if (strict) failures.push(`${message} Disable developer routes for production.`);
    else warnings.push(`${message} Keep it false or omitted in production.`);
  }
}

if (fs.existsSync(path.join(root, "netlify.toml"))) {
  const netlify = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  if (!/command\s*=\s*["']npm run build["']/.test(netlify)) failures.push("netlify.toml must use npm run build.");
  if (!/publish\s*=\s*["']dist["']/.test(netlify)) failures.push("netlify.toml must publish dist.");
  if (/VITE_SUPABASE_(?:URL|ANON_KEY)\s*=/.test(netlify)) failures.push("Do not commit Supabase values in netlify.toml; configure them in Netlify UI.");
}

if (fs.existsSync(path.join(root, "public/_redirects"))) {
  const redirects = fs.readFileSync(path.join(root, "public/_redirects"), "utf8");
  if (!/^\/\*\s+\/index\.html\s+200\s*$/m.test(redirects)) failures.push("public/_redirects is missing the React SPA rewrite.");
}

if (fs.existsSync(path.join(root, "public/_headers"))) {
  const headers = fs.readFileSync(path.join(root, "public/_headers"), "utf8");
  for (const required of ["Content-Security-Policy", "X-Content-Type-Options: nosniff", "X-Frame-Options: DENY", "Strict-Transport-Security"]) {
    if (!headers.includes(required)) failures.push(`public/_headers is missing ${required}.`);
  }
}

if (failures.length) {
  console.error("Production configuration validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
console.log(`Production configuration validation passed${strict ? " in strict mode" : ""}.`);
