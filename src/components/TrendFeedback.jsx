import { useState } from "react";
import { Check, Clock3, Sparkles } from "lucide-react";
import useStyleTrends from "../hooks/useStyleTrends.js";
import useAnalytics from "../hooks/useAnalytics.js";

const OPTIONS = [
  { value: "classic", label: "Keep it classic", icon: Clock3 },
  { value: "feels_right", label: "This feels right", icon: Check },
  { value: "more_current", label: "More current ideas", icon: Sparkles },
];

export default function TrendFeedback({ styleSuggestion, recommendationId = null }) {
  const { submitTrendFeedback, feedbackSaving } = useStyleTrends();
  const { track } = useAnalytics();
  const [selected, setSelected] = useState(null);

  if (!styleSuggestion?.trend?.adjustmentApplied) return null;

  const choose = async (value) => {
    if (feedbackSaving || selected) return;
    const result = await submitTrendFeedback({ response: value, styleSuggestion, recommendationId });
    if (result) {
      setSelected(value);
      track("trend_feedback_submitted", { experienceMode: "personalized", metadata: { feedback_type: value, trend_influence: styleSuggestion.trend?.influence || "unknown" } });
    }
  };

  return (
    <fieldset className="mt-4 border-t border-violet-200/10 pt-4">
      <legend className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-violet-100/70">Trend direction</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Trend suggestion feedback">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = selected === option.value;
          return (
            <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => choose(option.value)} disabled={feedbackSaving || Boolean(selected)} className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/20 ${active ? "border-violet-300/45 bg-violet-300/15 text-violet-100" : "border-slate-400/12 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"} disabled:cursor-default disabled:opacity-70`}>
              <Icon size={13} aria-hidden="true" />{active ? "Saved" : option.label}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">{selected ? "Trend feedback saved." : feedbackSaving ? "Saving trend feedback." : ""}</p>
    </fieldset>
  );
}
