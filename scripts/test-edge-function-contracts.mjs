import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const functions = [
  "get-weather",
  "analyze-closet-item",
  "analyze-wardrobe-item",
  "generate-jacket-embedding",
  "sync-style-trends",
  "track-analytics",
  "get-analytics-dashboard",
  "get-developer-access",
  "manage-developer-access",
  "delete-account",
];
const errors = [];
const visited = new Set();

function resolveLocalImport(file, specifier) {
  const target = path.resolve(path.dirname(file), specifier);
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  for (const extension of [".ts", ".tsx", ".js", ".jsx"]) {
    if (fs.existsSync(`${target}${extension}`)) return `${target}${extension}`;
  }
  return null;
}

async function checkModule(file) {
  const normalized = path.resolve(file);
  if (visited.has(normalized)) return;
  visited.add(normalized);

  const text = fs.readFileSync(normalized, "utf8");
  try {
    await transform(text, {
      loader: normalized.endsWith(".tsx") ? "tsx" : "ts",
      target: "es2022",
      format: "esm",
      sourcefile: path.relative(process.cwd(), normalized),
    });
  } catch (error) {
    errors.push(`${path.relative(process.cwd(), normalized)} has invalid TypeScript: ${error.message}`);
  }

  for (const match of text.matchAll(/(?:from\s+|import\s*)["'](\.\.?\/[^"']+)["']/g)) {
    const target = resolveLocalImport(normalized, match[1]);
    if (!target) {
      errors.push(`${path.relative(process.cwd(), normalized)} imports missing module ${match[1]}`);
      continue;
    }
    await checkModule(target);
  }
}

for (const name of functions) {
  const file = `supabase/functions/${name}/index.ts`;
  if (!fs.existsSync(file)) {
    errors.push(`missing ${file}`);
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const token of ["handleCorsPreflight", "getRequestId"]) {
    if (!text.includes(token)) errors.push(`${file} does not use ${token}`);
  }
  if (!text.includes("Deno.serve")) errors.push(`${file} has no Deno.serve handler`);
  await checkModule(file);
}

if (errors.length) {
  console.error("Edge Function contract audit failed:\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`Edge Function import, TypeScript, and security contract audit passed (${visited.size} modules checked).`);
