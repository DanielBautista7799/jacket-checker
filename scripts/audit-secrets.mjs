import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set(["node_modules", "dist", ".git", ".temp", "coverage", "test-results", "playwright-report"]);
const ignoredFiles = new Set(["package-lock.json"]);
const allowedExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".toml", ".sql", ".md", ".txt", ".env", ""]);

const patterns = [
  ["Supabase service-role JWT", /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g],
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["Google API key", /\bAIza[A-Za-z0-9_-]{30,}\b/g],
  ["GitHub token", /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Database URL with credentials", /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi],
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") return [];
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (ignoredFiles.has(entry.name) || entry.name.endsWith(".zip")) return [];
    return allowedExtensions.has(path.extname(entry.name)) ? [full] : [];
  });
}

const findings = [];
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      findings.push(`${path.relative(root, file)}: ${label} near character ${match.index}`);
    }
  }
}

if (findings.length) {
  console.error("Secret audit failed:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Secret audit passed: no likely secret values were found.");
