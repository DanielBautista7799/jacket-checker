import {
  ANALYTICS_STORAGE_KEY,
} from "../config/analyticsConfig.js";

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }
  );
}

export function createAnonymousSessionId() {
  try {
    const existing = sessionStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const next = createUuid();
    sessionStorage.setItem(ANALYTICS_STORAGE_KEY, next);
    return next;
  } catch {
    return createUuid();
  }
}

export default createAnonymousSessionId;
