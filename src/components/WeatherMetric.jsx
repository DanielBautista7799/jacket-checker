import { cn } from "../lib/utils";

export default function WeatherMetric({ icon: Icon, label, value, accent = "text-cyan-200", className = "" }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-slate-400/12 bg-white/[0.035] p-4", className)}>
      <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {Icon && <Icon size={16} className={accent} aria-hidden="true" />}
        {label}
      </dt>
      <dd className="font-display mt-2 text-xl font-bold tracking-[-0.03em] text-white">{value}</dd>
    </div>
  );
}
