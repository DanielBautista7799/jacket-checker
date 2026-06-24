import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, "dist");
const failures = [];
const warnings = [];

function exists(relative) {
  return fs.existsSync(path.join(dist, relative));
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (!fs.existsSync(dist)) {
  console.error("Production build validation failed: dist does not exist. Run npm run build first.");
  process.exit(1);
}

for (const relative of ["index.html", "_headers", "_redirects"]) {
  if (!exists(relative)) failures.push(`Missing dist/${relative}`);
}

const files = walk(dist);
const assetFiles = files.filter((file) => file.includes(`${path.sep}assets${path.sep}`));
if (assetFiles.length === 0) failures.push("dist/assets does not contain generated assets.");

for (const file of files) {
  const relative = path.relative(dist, file);
  const stat = fs.statSync(file);
  if (file.endsWith(".map")) failures.push(`Unexpected production source map: ${relative}`);
  if (/\.(?:js|css)$/.test(file) && stat.size > 2 * 1024 * 1024) {
    failures.push(`Generated asset exceeds 2 MiB: ${relative}`);
  } else if (/\.(?:js|css)$/.test(file) && stat.size > 750 * 1024) {
    warnings.push(`Large generated asset: ${relative}`);
  }
}

const textFiles = files.filter((file) => /\.(?:html|js|css|json|txt)$/.test(file) || ["_headers", "_redirects"].includes(path.basename(file)));
const secretPatterns = [
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["Google API key", /\bAIza[A-Za-z0-9_-]{30,}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Database URL with credentials", /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi],
  ["Supabase service-role reference", /SUPABASE_SERVICE_ROLE_KEY/g],
  ["Rate-limit salt reference", /RATE_LIMIT_SALT/g],
];

for (const file of textFiles) {
  const relative = path.relative(dist, file);
  const text = fs.readFileSync(file, "utf8");
  if (/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(text)) {
    const vendorChunk = /^(?:react|supabase|icons)-/i.test(path.basename(file));
    if (!vendorChunk) failures.push(`Development URL found in ${relative}`);
  }
  if (/sourceMappingURL=/i.test(text)) failures.push(`Source map reference found in ${relative}`);
  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${label} found in ${relative}`);
  }
}

if (exists("index.html")) {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  if (html.includes('/src/main.jsx')) failures.push("dist/index.html still references the Vite development entry.");
  const refs = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((match) => match[1].replace(/^\//, ""));
  for (const ref of refs) if (!exists(ref)) failures.push(`dist/index.html references missing asset ${ref}`);
}

if (exists("_headers")) {
  const headers = fs.readFileSync(path.join(dist, "_headers"), "utf8");
  if (!headers.includes("Content-Security-Policy")) failures.push("dist/_headers is missing Content-Security-Policy.");
}

if (exists("_redirects")) {
  const redirects = fs.readFileSync(path.join(dist, "_redirects"), "utf8");
  if (!/^\/\*\s+\/index\.html\s+200\s*$/m.test(redirects)) failures.push("dist/_redirects is missing the SPA rewrite.");
}

if (failures.length) {
  console.error("Production build validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
console.log(`Production build validation passed across ${files.length} generated files.`);
