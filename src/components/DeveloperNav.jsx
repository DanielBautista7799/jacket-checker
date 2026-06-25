import { createElement } from "react";
import {
  BarChart3,
  Bug,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "../lib/utils";

const developerLinks = [
  {
    to: "/dev/access",
    label: "Access",
    description: "Admins and audit history",
    icon: UsersRound,
  },
  {
    to: "/dev/scoring",
    label: "Scoring",
    description: "Recommendation diagnostics",
    icon: Bug,
  },
  {
    to: "/dev/trends",
    label: "Trends",
    description: "Style-rule administration",
    icon: Sparkles,
  },
  {
    to: "/dev/analytics",
    label: "Analytics",
    description: "Privacy-safe product metrics",
    icon: BarChart3,
  },
];

export default function DeveloperNav() {
  return (
    <section
      className="glass-card rounded-[var(--radius-card-lg)] p-3 sm:p-4"
      aria-labelledby="developer-tools-navigation-title"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p
              id="developer-tools-navigation-title"
              className="text-sm font-black text-white"
            >
              Developer tools
            </p>
            <p className="text-xs text-slate-400">
              Access verified against the server-only developer registry.
            </p>
          </div>
        </div>

        <nav
          aria-label="Developer tools navigation"
          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
        >
          {developerLinks.map(({ to, label, description, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              viewTransition
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20",
                  isActive
                    ? "border-blue-300/25 bg-blue-400/12 text-sky-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                    : "border-slate-400/12 bg-white/[0.025] text-slate-300 hover:border-slate-300/22 hover:bg-white/[0.055] hover:text-white",
                )
              }
            >
              {createElement(Icon, {
                size: 19,
                strokeWidth: 2,
                "aria-hidden": true,
              })}
              <span className="min-w-0">
                <span className="block text-sm font-black">{label}</span>
                <span className="hidden truncate text-[0.68rem] text-slate-500 2xl:block">
                  {description}
                </span>
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </section>
  );
}
