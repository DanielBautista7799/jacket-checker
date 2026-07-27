import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const packageJson = JSON.parse(read("package.json"));
const project = read("ios/App/App.xcodeproj/project.pbxproj");
const infoPlist = read("ios/App/App/Info.plist");
const readme = read("README.md");

const removedFiles = [
  "scripts/test-ios-testflight-readiness.mjs",
  "scripts/ios-testflight-preflight.sh",
  "scripts/ios-testflight-archive.sh",
  "scripts/ios-testflight-inspect-archive.sh",
  "scripts/ios-testflight-open-archive.sh",
  "docs/IOS_TESTFLIGHT_FULL_BUILD_PATH.md",
  "docs/IOS_PHYSICAL_DEVICE_TEST_MATRIX.md",
  "docs/APP_STORE_CONNECT_VALUES.md",
  "docs/APP_PRIVACY_WORKSHEET.md",
  "docs/TESTFLIGHT_BETA_DETAILS.md",
  "docs/APP_REVIEW_NOTES.md",
  "docs/TESTFLIGHT_PHASE_DEFERRED_ITEMS.md",
  "docs/APP_STORE_METADATA.md",
  "docs/IOS_RELEASE_READINESS.md",
];

const checks = [
  [
    "paid-distribution scripts are removed",
    !Object.keys(packageJson.scripts ?? {}).some((name) =>
      name.startsWith("ios:testflight:"),
    ) && !packageJson.scripts?.["mobile:release:archive"],
  ],
  [
    "paid-distribution files are removed",
    removedFiles.every((file) => !exists(file)),
  ],
  [
    "free iOS workflow scripts are configured",
    packageJson.scripts?.["ios:free:check"] ===
      "bash scripts/ios-free-final-check.sh" &&
      packageJson.scripts?.["ios:free:open"] ===
        "npm run mobile:sync && npx cap open ios" &&
      packageJson.scripts?.["project:final:check"] ===
        "bash scripts/ios-free-final-check.sh",
  ],
  [
    "free iOS documentation exists",
    exists("docs/IOS_FREE_INSTALL_AND_FINALIZATION.md") &&
      exists("docs/IOS_FREE_DEVICE_TEST_MATRIX.md") &&
      exists("docs/PROJECT_FINAL_STATUS.md"),
  ],
  [
    "README documents the free iOS status",
    readme.includes("<!-- IOS_FREE_FINALIZATION_START -->") &&
      readme.includes("https://jacketchecker.netlify.app/"),
  ],
  [
    "foreground-only location is configured",
    infoPlist.includes("NSLocationWhenInUseUsageDescription") &&
      !infoPlist.includes("NSLocationAlwaysAndWhenInUseUsageDescription"),
  ],
  [
    "legacy armv7 capability declaration is removed",
    !infoPlist.includes("UIRequiredDeviceCapabilities") &&
      !infoPlist.includes("<string>armv7</string>"),
  ],
  [
    "the native target is iPhone only",
    (project.match(/TARGETED_DEVICE_FAMILY = 1;/g) ?? []).length >= 2,
  ],
  [
    "the privacy manifest remains included",
    exists("ios/App/App/PrivacyInfo.xcprivacy") &&
      project.includes("PrivacyInfo.xcprivacy in Resources"),
  ],
  [
    "generated launch-logo assets are removed",
    !exists("ios/App/App/Assets.xcassets/LaunchLogo.imageset"),
  ],
];

let failed = 0;
for (const [name, condition] of checks) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failed += 1;
    console.error(`✗ ${name}`);
  }
}

console.log(`\n${checks.length - failed}/${checks.length} free-finalization checks passed.`);

if (failed > 0) {
  process.exit(1);
}
