import { Flame, ThumbsDown, ThumbsUp } from "lucide-react";

const options = [
  { value: "fire", label: "Fire", icon: Flame, description: "Strong match" },
  { value: "good", label: "Good", icon: ThumbsUp, description: "Worked well" },
  { value: "not_it", label: "Not It", icon: ThumbsDown, description: "Choose another" },
];

export default function RecommendationFeedback({ value, onChange, loading = false, disabled = false }) {
  return (
    <fieldset className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
      <legend className="px-1 font-black text-white">Did this jacket and style idea work?</legend>
      <p className="mt-1 text-xs leading-5 text-purple-100/70">Your answer helps future checks learn which jackets work best in similar weather.</p>

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
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/30 ${active ? "border-purple-300/60 bg-purple-500 text-white" : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10"} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-5 text-center text-xs text-purple-200" aria-live="polite">
        {loading ? "Saving feedback…" : value ? "Saved — future checks will use this in similar conditions." : ""}
      </p>
    </fieldset>
  );
}
