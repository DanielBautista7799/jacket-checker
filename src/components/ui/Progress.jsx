import { cn } from "../../lib/utils";

export default function Progress({ value = null, label = "Progress", className = "" }) {
  const determinate = Number.isFinite(value);
  const width = determinate ? `${Math.min(100, Math.max(0, value))}%` : "42%";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round(value) : undefined}
      className={cn("h-2 overflow-hidden rounded-full bg-slate-950/70", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 transition-[width] duration-300",
          !determinate && "animate-pulse"
        )}
        style={{ width }}
      />
    </div>
  );
}
