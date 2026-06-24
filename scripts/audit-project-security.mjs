import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const findings = [];
const forbiddenFiles = [
  "src/components/OwnedOutfitCard.jsx",
  "src/utils/generateWardrobeOutfit.js",
  "src/utils/outfitColorRules.js",
  "src/components/BackgroundRemovalEditor.jsx",
  "supabase/functions/remove-wardrobe-background/index.ts",
];
for (const file of forbiddenFiles) {
  if (fs.existsSync(file)) findings.push(`obsolete feature file still exists: ${file}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".git", "coverage", "test-results", "playwright-report"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(?:js|jsx|ts|tsx|html)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of walk(path.join(root, "src"))) {
  const text = fs.readFileSync(file, "utf8");
  if (/dangerouslySetInnerHTML/.test(text)) findings.push(`${path.relative(root, file)} uses dangerouslySetInnerHTML`);
  if (/https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(text) && !/supabase|weatherapi/i.test(text)) {
    findings.push(`${path.relative(root, file)} contains an unexpected external URL`);
  }
  if (/\b(?:shopping|retailer|affiliate|buy now|purchase)\b/i.test(text)) {
    findings.push(`${path.relative(root, file)} contains forbidden shopping language`);
  }
}

const headers = fs.existsSync("public/_headers") ? fs.readFileSync("public/_headers", "utf8") : "";
for (const required of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
  if (!headers.includes(required)) findings.push(`public/_headers is missing ${required}`);
}

if (findings.length) {
  console.error("Project security audit failed:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Project security audit passed.");
