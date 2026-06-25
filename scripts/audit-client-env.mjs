import fs from "node:fs";
import path from "node:path";

const allowed = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "DEV",
  "PROD",
  "MODE",
  "BASE_URL",
  "SSR",
]);
const forbiddenName = /(SECRET|SERVICE_ROLE|DATABASE|PASSWORD|PRIVATE|GEMINI|OPENAI|WEATHER_API_KEY)/i;
const findings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".git", "coverage"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of walk(path.join(process.cwd(), "src"))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)) {
    const name = match[1];
    if (!allowed.has(name) || forbiddenName.test(name)) {
      findings.push(`${path.relative(process.cwd(), file)} uses disallowed client environment variable ${name}`);
    }
  }
}

if (fs.existsSync(".env.example")) {
  const envText = fs.readFileSync(".env.example", "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const name = line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1];
    if (name && name.startsWith("VITE_") && !allowed.has(name)) findings.push(`.env.example contains disallowed client variable ${name}`);
  }
}

if (findings.length) {
  console.error("Client environment audit failed:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Client environment audit passed.");
