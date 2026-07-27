import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];

function check(name, condition) {
  checks.push({ name, condition: Boolean(condition) });
}

function readPngMetadata(file) {
  const data = fs.readFileSync(path.join(root, file));

  if (data.length < 26 || data.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    return null;
  }

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

const appDelegate = read("ios/App/App/AppDelegate.swift");
const sceneDelegate = read("ios/App/App/SceneDelegate.swift");
const infoPlist = read("ios/App/App/Info.plist");
const project = read("ios/App/App.xcodeproj/project.pbxproj");
const launchScreen = read("ios/App/App/Base.lproj/LaunchScreen.storyboard");
const appIconContents = read(
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
);
const appSource = read("src/App.jsx");
const iconFile =
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/JacketChecker-AppIcon-1024.png";
const icon = readPngMetadata(iconFile);

check(
  "AppDelegate uses the modern application entry point",
  appDelegate.includes("@main") &&
    appDelegate.includes("configurationForConnecting") &&
    !appDelegate.includes("@UIApplicationMain"),
);

check(
  "SceneDelegate is registered in the Xcode target",
  project.includes("SceneDelegate.swift in Sources") &&
    sceneDelegate.includes("UIWindowSceneDelegate"),
);

check(
  "scene lifecycle is declared in Info.plist",
  infoPlist.includes("UIApplicationSceneManifest") &&
    infoPlist.includes("$(PRODUCT_MODULE_NAME).SceneDelegate") &&
    infoPlist.includes("UISceneStoryboardFile") &&
    !infoPlist.includes("UIMainStoryboardFile"),
);

check(
  "cold-launch URLs are queued until scene activation",
  sceneDelegate.includes("pendingURLContext") &&
    sceneDelegate.includes("pendingUserActivity") &&
    sceneDelegate.includes("sceneDidBecomeActive") &&
    sceneDelegate.includes("flushPendingLaunchContexts"),
);

check(
  "warm scene deep links continue through Capacitor",
  sceneDelegate.includes("openURLContexts") &&
    sceneDelegate.includes("ApplicationDelegateProxy.shared.application") &&
    sceneDelegate.includes("continue userActivity"),
);

check(
  "native authentication URL scheme remains configured",
  infoPlist.includes("com.danielbautista.jacketchecker.auth") &&
    infoPlist.includes("<string>jacketchecker</string>"),
);

check(
  "foreground location permission remains configured",
  infoPlist.includes("NSLocationWhenInUseUsageDescription") &&
    !infoPlist.includes("NSLocationAlwaysAndWhenInUseUsageDescription"),
);

check(
  "export-compliance flag remains explicit",
  /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(infoPlist),
);

check(
  "release identity is version 1.0 build 1",
  project.includes("MARKETING_VERSION = 1.0;") &&
    project.includes("CURRENT_PROJECT_VERSION = 1;") &&
    project.includes(
      "PRODUCT_BUNDLE_IDENTIFIER = com.danielbautista.jacketchecker;",
    ),
);

check(
  "automatic signing remains enabled",
  project.includes("CODE_SIGN_STYLE = Automatic;"),
);

check(
  "the native target is iPhone only",
  (project.match(/TARGETED_DEVICE_FAMILY = 1;/g) ?? []).length >= 2 &&
    !project.includes('TARGETED_DEVICE_FAMILY = "1,2";'),
);

check(
  "app icon is a nontransparent 1024-pixel PNG",
  icon?.width === 1024 &&
    icon?.height === 1024 &&
    ![4, 6].includes(icon?.colorType) &&
    appIconContents.includes("JacketChecker-AppIcon-1024.png"),
);

check(
  "launch screen is simple and does not reference a generated logo",
  launchScreen.includes("Jacket Checker") &&
    launchScreen.includes("Weather-aware jacket recommendations") &&
    !launchScreen.includes("LaunchLogo"),
);

check(
  "public privacy and support routes remain available",
  exists("src/pages/PrivacyPage.jsx") &&
    exists("src/pages/SupportPage.jsx") &&
    appSource.includes('path="/privacy"') &&
    appSource.includes('path="/support"'),
);

check(
  "privacy manifest remains in the iOS target",
  exists("ios/App/App/PrivacyInfo.xcprivacy") &&
    project.includes("PrivacyInfo.xcprivacy in Resources"),
);

let failed = 0;

for (const result of checks) {
  if (result.condition) {
    console.log(`✓ ${result.name}`);
  } else {
    failed += 1;
    console.error(`✗ ${result.name}`);
  }
}

console.log(`\n${checks.length - failed}/${checks.length} iOS release checks passed.`);

if (failed > 0) {
  process.exit(1);
}
