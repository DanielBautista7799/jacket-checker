import { cn } from "../../lib/utils";

export default function Toggle({ checked, onChange, disabled = false, label, description, className = "" }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 rounded-[var(--radius-card)] border border-slate-400/14 bg-white/[0.035] p-4", disabled && "cursor-not-allowed opacity-60", className)}>
      <span>
        <span className="block text-sm font-extrabold text-white">{label}</span>
        {description && <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>}
      </span>
      <input className="sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span aria-hidden="true" className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-blue-300/30 bg-blue-500" : "border-slate-400/20 bg-slate-700")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}
