import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const SEARCH_ROOTS = ["src", "tests"];
const EXTRA_FILES = ["vite.config.js"];
const ALLOWED_EXTENSIONS = new Set([
".js",
".jsx",
".mjs",
".ts",
".tsx",
]);

async function collectFiles(entryPath) {
const absolutePath = path.join(PROJECT_ROOT, entryPath);
const entryStats = await stat(absolutePath);

if (entryStats.isFile()) {
return [absolutePath];
}

const entries = await readdir(absolutePath, {
withFileTypes: true,
});

const nestedFiles = await Promise.all(
entries.map(async (entry) => {
    const childPath = path.join(entryPath, entry.name);

    if (entry.isDirectory()) {
    return collectFiles(childPath);
    }

    const extension = path.extname(entry.name);

    return ALLOWED_EXTENSIONS.has(extension)
    ? [path.join(PROJECT_ROOT, childPath)]
    : [];
}),
);

return nestedFiles.flat();
}

function migrateSource(source) {
return source
.replaceAll('"react-router-dom"', '"react-router"')
.replaceAll("'react-router-dom'", "'react-router'");
}

async function main() {
const groupedFiles = await Promise.all(
SEARCH_ROOTS.map((root) => collectFiles(root)),
);

const files = [
...groupedFiles.flat(),
...EXTRA_FILES.map((file) => path.join(PROJECT_ROOT, file)),
];

let changedFiles = 0;
let changedReferences = 0;

for (const file of files) {
const source = await readFile(file, "utf8");
const matches =
    source.match(/["']react-router-dom["']/g) || [];

if (matches.length === 0) {
    continue;
}

const migratedSource = migrateSource(source);

await writeFile(file, migratedSource, "utf8");

changedFiles += 1;
changedReferences += matches.length;

console.log(
    `Updated ${path.relative(PROJECT_ROOT, file)} (${matches.length})`,
);
}

const remainingReferences = [];

for (const file of files) {
const source = await readFile(file, "utf8");

if (source.includes("react-router-dom")) {
    remainingReferences.push(
    path.relative(PROJECT_ROOT, file),
    );
}
}

if (remainingReferences.length > 0) {
console.error(
    "Migration incomplete. References remain in:",
    remainingReferences,
);

process.exitCode = 1;
return;
}

console.log("");
console.log(
`React Router migration complete: ${changedReferences} references across ${changedFiles} files.`,
);
}

main().catch((error) => {
console.error("React Router migration failed.");
console.error(error);
process.exitCode = 1;
});