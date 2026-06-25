import { describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  DARK_THEME,
  getPreferredTheme,
  LIGHT_THEME,
  readStoredTheme,
  THEME_STORAGE_KEY,
} from "../../src/utils/theme";

describe("theme utilities", () => {
  it("prefers a saved theme over the operating-system preference", () => {
    const storage = {
      getItem: vi.fn((key) => (key === THEME_STORAGE_KEY ? LIGHT_THEME : null)),
    };
    const matchMedia = vi.fn(() => ({ matches: false }));

    expect(getPreferredTheme({ storage, matchMedia })).toBe(LIGHT_THEME);
  });

  it("uses the operating-system preference when no saved theme exists", () => {
    const storage = { getItem: vi.fn(() => null) };
    const matchMedia = vi.fn(() => ({ matches: true }));

    expect(getPreferredTheme({ storage, matchMedia })).toBe(LIGHT_THEME);
  });

  it("falls back safely when storage access is blocked", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };

    expect(readStoredTheme(storage)).toBeNull();
    expect(getPreferredTheme({ storage, matchMedia: () => ({ matches: false }) })).toBe(DARK_THEME);
  });

  it("applies the theme to the document and updates the browser theme color", () => {
    document.head.innerHTML = '<meta name="theme-color" content="#070b14">';
    applyTheme(LIGHT_THEME, document);

    expect(document.documentElement.dataset.theme).toBe(LIGHT_THEME);
    expect(document.documentElement.style.colorScheme).toBe(LIGHT_THEME);
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#eef4fb");
  });
});
