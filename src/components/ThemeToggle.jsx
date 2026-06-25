import { Moon, Sun } from "lucide-react";
import useTheme from "../hooks/useTheme";
import { cn } from "../lib/utils";

export default function ThemeToggle({ withMobileNav = false }) {
  const { isDark, toggleTheme } = useTheme();
  const nextTheme = isDark ? "light" : "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "theme-toggle touch-target",
        withMobileNav && "theme-toggle-with-mobile-nav"
      )}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
      <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
