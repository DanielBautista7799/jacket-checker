import { useState } from "react";
import { Check, Clock3, Sparkles } from "lucide-react";
import useStyleTrends from "../hooks/useStyleTrends.js";

const OPTIONS = [
  { value: "classic", label: "Keep it classic", icon: Clock3 },
  { value: "feels_right", label: "This feels right", icon: Check },
  { value: "more_current", label: "More current ideas", icon: Sparkles },
];

export default function TrendFeedback({ styleSuggestion, recommendationId = null }) {
  const { submitTrendFeedback, feedbackSaving } = useStyleTrends();
  const [selected, setSelected] = useState(null);

  if (!styleSuggestion?.trend?.adjustmentApplied) return null;

  const choose = async (value) => {
    if (feedbackSaving || selected) return;

    const result = await submitTrendFeedback({
      response: value,
      styleSuggestion,
      recommendationId,
    });

    if (result) setSelected(value);
  };

  return (
    <div className="mt-4 border-t border-emerald-200/10 pt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-100/70">
        Trend direction
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const { value, label } = option;

          return (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            disabled={feedbackSaving || Boolean(selected)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${
              selected === value
                ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            } disabled:cursor-default disabled:opacity-70`}
          >
            <IconComponent size={13} />
            {selected === value ? "Saved" : label}
          </button>
          );
        })}
      </div>
    </div>
  );
}
