import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const ignoredDirs = new Set([
  "node_modules",
  "dist",
  ".git",
  ".temp",
  "coverage",
  "test-results",
  "playwright-report",
]);

const ignoredFiles = new Set([
  "package-lock.json",
]);

const allowedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".toml",
  ".sql",
  ".md",
  ".txt",
  ".env",
  "",
]);

const secretPatterns = [
  [
    "Supabase secret key",
    /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g,
  ],
  [
    "OpenAI-style secret",
    /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  ],
  [
    "Google API key",
    /\bAIza[A-Za-z0-9_-]{30,}\b/g,
  ],
  [
    "GitHub token",
    /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/g,
  ],
  [
    "Private key",
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  ],
  [
    "Database URL with credentials",
    /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi,
  ],
];

const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g;

const privilegedSupabaseRoles = new Set([
  "service_role",
  "supabase_admin",
]);

function walk(directory) {
  return fs
    .readdirSync(directory, {
      withFileTypes: true,
    })
    .flatMap((entry) => {
      if (
        entry.name.startsWith(".") &&
        entry.name !== ".env.example"
      ) {
        return [];
      }

      if (
        entry.isDirectory() &&
        ignoredDirs.has(entry.name)
      ) {
        return [];
      }

      const fullPath = path.join(
        directory,
        entry.name,
      );

      if (entry.isDirectory()) {
        return walk(fullPath);
      }

      if (
        ignoredFiles.has(entry.name) ||
        entry.name.endsWith(".zip")
      ) {
        return [];
      }

      return allowedExtensions.has(
        path.extname(entry.name),
      )
        ? [fullPath]
        : [];
    });
}

function decodeJwtPayload(token) {
  try {
    const encodedPayload = token.split(".")[1];

    if (!encodedPayload) {
      return null;
    }

    const normalized = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      normalized.length +
        ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(
      Buffer.from(padded, "base64").toString("utf8"),
    );
  } catch {
    return null;
  }
}

function inspectJwt(token) {
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const role =
    typeof payload.role === "string"
      ? payload.role
      : "";

  if (privilegedSupabaseRoles.has(role)) {
    return `Supabase privileged JWT (${role})`;
  }

  return null;
}

const findings = [];

for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file);

  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      findings.push(
        `${relativePath}: ${label} near character ${match.index}`,
      );
    }
  }

  jwtPattern.lastIndex = 0;

  for (const match of text.matchAll(jwtPattern)) {
    const label = inspectJwt(match[0]);

    if (label) {
      findings.push(
        `${relativePath}: ${label} near character ${match.index}`,
      );
    }
  }
}

if (findings.length > 0) {
  console.error(
    `Secret audit failed:\n${findings.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  "Secret audit passed: no likely secret values were found.",
);