import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const analyticsModule = await import(pathToFileURL(path.join(root, "src/utils/sanitizeAnalyticsPayload.js")));
const { sanitizeAnalyticsEvent, sanitizeAnalyticsMetadata } = analyticsModule;

test("analytics metadata removes sensitive keys", () => {
  const sanitized = sanitizeAnalyticsMetadata({
    forecast_window: "tomorrow",
    email: "private@example.com",
    latitude: 35.9,
    image_path: "private/jacket.jpg",
    decision: "YES",
  });
  assert(sanitized.forecast_window === "tomorrow", "Safe metadata should remain.");
  assert(sanitized.decision === "YES", "Decision should remain.");
  assert(!("email" in sanitized), "Email must be removed.");
  assert(!("latitude" in sanitized), "Coordinates must be removed.");
  assert(!("image_path" in sanitized), "Image paths must be removed.");
});

test("unknown analytics events are rejected", () => {
  let rejected = false;
  try { sanitizeAnalyticsEvent({ event_name: "unknown_event", experience_mode: "guest" }); } catch { rejected = true; }
  assert(rejected, "Unknown event should be rejected.");
});

test("duration and route values are bounded", () => {
  const event = sanitizeAnalyticsEvent({
    event_name: "guest_check_completed",
    experience_mode: "guest",
    route: "https://bad.example/path",
    duration_ms: 9999999,
  });
  assert(event.route === "/", "Unsafe route should fall back to root.");
  assert(event.duration_ms === 300000, "Duration should be capped.");
});

test("analytics failure isolation exists", () => {
  const source = read("src/context/AnalyticsContext.jsx");
  assert(source.includes("ANALYTICS_FAILURE_LIMIT"), "Failure limit should disable noisy analytics.");
  assert(source.includes("catch"), "Analytics should catch failures.");
});

test("guest sessions use random UUID storage", () => {
  const source = read("src/utils/createAnonymousSessionId.js");
  assert(source.includes("randomUUID"), "Anonymous sessions should prefer crypto.randomUUID.");
  assert(source.includes("sessionStorage"), "Anonymous sessions should be session-scoped.");
});

test("developer analytics requires authorization", () => {
  const source = read("supabase/functions/get-analytics-dashboard/index.ts");
  const accessCheck = read("supabase/functions/get-developer-access/index.ts");
  const sharedAccess = read("supabase/functions/_shared/security/adminAccess.ts");
  assert(source.includes("requireDeveloper"), "Dashboard must require developer access.");
  assert(accessCheck.includes("requireDeveloper"), "Route access checks must require developer access.");
  assert(sharedAccess.includes("developer_access_registry"), "Developer registry should be the primary authorization source.");
  assert(sharedAccess.includes("legacy_secret"), "Legacy secrets should be limited to first-owner bootstrap.");
});

test("analytics table is server-only", () => {
  const migration = read("supabase/migrations/20260623030000_create_privacy_safe_analytics.sql");
  assert(migration.includes("revoke all on table public.analytics_events from anon, authenticated"), "Direct event access must be revoked.");
  assert(migration.includes("enable row level security"), "Analytics table must use RLS.");
});

test("guest location search is an accessible combobox", () => {
  const source = read("src/components/LocationSearch.jsx");
  assert(source.includes('role="combobox"'), "Location input should be a combobox.");
  assert(source.includes('role="listbox"'), "Suggestions should use listbox semantics.");
  assert(source.includes('aria-live="polite"'), "Search status should be announced.");
});

test("recommendation feedback is keyboard-accessible", () => {
  const source = read("src/components/RecommendationFeedback.jsx");
  assert(source.includes('role="radiogroup"'), "Feedback should use a radio group.");
  assert(source.includes('aria-checked'), "Feedback state should be announced.");
});

test("dialogs trap and restore focus", () => {
  const source = read("src/components/ui/Modal.jsx");
  assert(source.includes("previousFocusRef"), "Modal should restore focus.");
  assert(source.includes('event.key === "Escape"'), "Escape should close dialogs.");
  assert(source.includes('event.key !== "Tab"'), "Tab focus should be contained.");
});

test("route changes announce and focus main content", () => {
  const source = read("src/components/ui/RouteAnnouncer.jsx");
  assert(source.includes('aria-live="polite"'), "Routes should be announced.");
  assert(source.includes("main?.focus"), "Main content should receive route focus.");
});

test("reduced motion is respected", () => {
  const source = read("src/styles/utilities.css");
  assert(source.includes("prefers-reduced-motion: reduce"), "Reduced motion media query is required.");
});

test("skip link and semantic main exist", () => {
  const source = read("src/App.jsx");
  assert(source.includes("Skip to main content"), "Skip link should exist.");
  assert(source.includes('id="main-content"'), "Main landmark should exist.");
});

test("developer tools stay out of primary navigation and appear only for approved accounts", () => {
  const source = read("src/components/AppHeader.jsx");
  const primaryLinks = source.match(/const accountLinks = \[(.*?)\];/s)?.[1] || "";
  assert(!primaryLinks.includes("/dev/"), "Developer tools must not appear in primary navigation.");
  assert(source.includes("isDeveloper &&"), "Developer menu entry must be conditional.");
  assert(source.includes('to="/dev/access"'), "Approved accounts need a Developer tools menu entry that opens the access registry.");
  assert(source.includes("Developer tools"), "The approved-account menu entry needs the Developer tools label.");
});

test("no shopping mechanics or retailer links were added", () => {
  const files = [
    "src/pages/DeveloperAnalyticsPage.jsx",
    "src/context/AnalyticsContext.jsx",
    "src/components/AppHeader.jsx",
    "src/pages/GuestPage.jsx",
    "src/pages/PersonalizedPage.jsx",
  ];
  const combined = files.map(read).join("\n").toLowerCase();
  for (const term of ["affiliate", "retailer", "buy now", "shopping recommendation", "product price"]) {
    assert(!combined.includes(term), `Unexpected shopping term: ${term}`);
  }
});

test("phase 12 function configuration exists", () => {
  const config = read("supabase/config.toml");
  assert(config.includes("[functions.track-analytics]"), "Tracking function must be configured.");
  assert(config.includes("[functions.get-analytics-dashboard]"), "Dashboard function must be configured.");
  assert(config.includes("[functions.get-developer-access]"), "Developer access function must be configured.");
  assert(config.includes("[functions.manage-developer-access]"), "Developer access management function must be configured.");
});

let passed = 0;
for (const current of tests) {
  try {
    await current.fn();
    console.log(`✓ ${current.name}`);
    passed += 1;
  } catch (error) {
    console.error(`✗ ${current.name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\n${passed}/${tests.length} Phase 12 tests passed.`);
if (passed !== tests.length) process.exit(1);
