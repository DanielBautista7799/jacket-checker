import { Flame, ThumbsDown, ThumbsUp } from "lucide-react";

const options = [
  { value: "fire", label: "Fire", icon: Flame, description: "Strong match" },
  { value: "good", label: "Good", icon: ThumbsUp, description: "Worked well" },
  { value: "not_it", label: "Not It", icon: ThumbsDown, description: "Choose another" },
];

export default function RecommendationFeedback({ value, onChange, loading = false, disabled = false }) {
  return (
    <fieldset className="rounded-[var(--radius-card)] border border-violet-300/18 bg-violet-400/[0.055] p-4 sm:p-5">
      <legend className="px-1 font-extrabold text-white">Did this jacket and style idea work?</legend>
      <p className="mt-1 text-xs leading-5 text-slate-400">Your answer helps future checks learn which jackets work best in similar weather.</p>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Recommendation feedback">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${option.label}: ${option.description}`}
              disabled={loading || disabled}
              onClick={() => onChange(option.value)}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/20 ${active ? "border-violet-300/45 bg-violet-400/20 text-white" : "border-slate-400/12 bg-white/[0.035] text-slate-300 hover:bg-white/[0.07]"} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-5 text-center text-xs font-bold text-violet-200" aria-live="polite">
        {loading ? "Saving feedback…" : value ? "Saved — future checks will use this in similar conditions." : ""}
      </p>
    </fieldset>
  );
}
