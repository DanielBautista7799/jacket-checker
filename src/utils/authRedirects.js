import { Capacitor } from "@capacitor/core";

export const NATIVE_AUTH_CALLBACK_URL =
"jacketchecker://auth/callback";

const PENDING_AUTH_INTENT_KEY =
"jacketcheck-pending-auth-intent";

const supportedAuthIntents = new Set([
"sign-up",
"recovery",
"email-change",
]);

function canUseLocalStorage() {
try {
return typeof window !== "undefined" &&
    Boolean(window.localStorage);
} catch {
return false;
}
}

export function isNativeApp() {
return Capacitor.isNativePlatform();
}

export function normalizeAuthIntent(value) {
const normalized = String(value || "")
.trim()
.toLowerCase()
.replaceAll("_", "-");

if (
normalized === "signup" ||
normalized === "email" ||
normalized === "invite" ||
normalized === "magiclink"
) {
return "sign-up";
}

if (normalized === "recovery") {
return "recovery";
}

if (normalized === "email-change") {
return "email-change";
}

return "";
}

export function setPendingAuthIntent(intent) {
const normalized = normalizeAuthIntent(intent);

if (
!isNativeApp() ||
!supportedAuthIntents.has(normalized) ||
!canUseLocalStorage()
) {
return;
}

window.localStorage.setItem(
PENDING_AUTH_INTENT_KEY,
normalized,
);
}

export function readPendingAuthIntent() {
if (!canUseLocalStorage()) {
return "";
}

return normalizeAuthIntent(
window.localStorage.getItem(
    PENDING_AUTH_INTENT_KEY,
),
);
}

export function clearPendingAuthIntent() {
if (!canUseLocalStorage()) {
return;
}

window.localStorage.removeItem(
PENDING_AUTH_INTENT_KEY,
);
}

export function consumePendingAuthIntent() {
const intent = readPendingAuthIntent();
clearPendingAuthIntent();
return intent;
}

export function createAuthRedirectUrl(
webPath,
intent,
) {
if (
typeof webPath !== "string" ||
!webPath.startsWith("/")
) {
throw new Error(
    "Authentication redirects require an application path.",
);
}

if (isNativeApp()) {
setPendingAuthIntent(intent);
return NATIVE_AUTH_CALLBACK_URL;
}

return new URL(
webPath,
window.location.origin,
).toString();
}

export function isNativeAuthCallbackUrl(value) {
try {
const url = new URL(value);

return (
    url.protocol === "jacketchecker:" &&
    url.hostname === "auth" &&
    url.pathname === "/callback"
);
} catch {
return false;
}
}

export function getAuthDestination(intent) {
const normalized = normalizeAuthIntent(intent);

if (normalized === "recovery") {
return "/auth/reset-password";
}

if (normalized === "email-change") {
return "/profile";
}

return "/app";
}