import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  DARK_THEME,
  getPreferredTheme,
  isTheme,
  LIGHT_THEME,
  persistTheme,
  THEME_STORAGE_KEY,
} from "../utils/theme";

export const ThemeContext = createContext(null);

function getInitialTheme() {
  const activeTheme = globalThis.document?.documentElement?.dataset?.theme;
  return isTheme(activeTheme) ? activeTheme : getPreferredTheme();
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme;
      return isTheme(resolvedTheme) ? resolvedTheme : currentTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }, []);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY || !isTheme(event.newValue)) return;
      setThemeState(event.newValue);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark: theme === DARK_THEME,
    isLight: theme === LIGHT_THEME,
    setTheme,
    toggleTheme,
  }), [setTheme, theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
