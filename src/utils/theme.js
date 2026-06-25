export const THEME_STORAGE_KEY = "jacket-checker-theme";
export const DARK_THEME = "dark";
export const LIGHT_THEME = "light";

const THEME_COLORS = {
  [DARK_THEME]: "#070b14",
  [LIGHT_THEME]: "#eef4fb",
};

export function isTheme(value) {
  return value === DARK_THEME || value === LIGHT_THEME;
}

function getBrowserStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function getBrowserMatchMedia(matchMedia) {
  if (matchMedia) return matchMedia;
  try {
    return globalThis.matchMedia || null;
  } catch {
    return null;
  }
}

export function readStoredTheme(storage) {
  try {
    const value = getBrowserStorage(storage)?.getItem?.(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getPreferredTheme({ storage, matchMedia } = {}) {
  const stored = readStoredTheme(storage);
  if (stored) return stored;

  try {
    const media = getBrowserMatchMedia(matchMedia);
    return media?.("(prefers-color-scheme: light)")?.matches ? LIGHT_THEME : DARK_THEME;
  } catch {
    return DARK_THEME;
  }
}

export function applyTheme(theme, documentRef = globalThis.document) {
  const nextTheme = isTheme(theme) ? theme : DARK_THEME;
  const root = documentRef?.documentElement;

  if (root) {
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
  }

  const themeColor = documentRef?.querySelector?.('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", THEME_COLORS[nextTheme]);

  return nextTheme;
}

export function persistTheme(theme, storage) {
  if (!isTheme(theme)) return;
  try {
    getBrowserStorage(storage)?.setItem?.(THEME_STORAGE_KEY, theme);
  } catch {
    // A blocked or unavailable storage layer should never prevent theme switching.
  }
}

export function initializeTheme(options = {}) {
  const theme = getPreferredTheme(options);
  return applyTheme(theme, options.documentRef || globalThis.document);
}
