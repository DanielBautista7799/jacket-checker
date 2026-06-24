const PREFIXES = [
  "jacket-check:",
  "jacketcheck:",
  "jacket_checker:",
];

export function clearClientCaches() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage can be unavailable in private browsing or hardened browsers.
  }

  try {
    sessionStorage.clear();
  } catch {
    // Session storage is best-effort only.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jacketcheck:clear-caches"));
  }
}

export default clearClientCaches;
