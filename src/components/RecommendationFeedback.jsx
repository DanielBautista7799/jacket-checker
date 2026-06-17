import { Flame, ThumbsDown, ThumbsUp } from "lucide-react";

const options = [
{
value: "fire",
label: "Fire",
icon: Flame,
},
{
value: "good",
label: "Good",
icon: ThumbsUp,
},
{
value: "not_it",
label: "Not it",
icon: ThumbsDown,
},
];

function RecommendationFeedback({
value,
onChange,
loading = false,
disabled = false,
}) {
return (
<div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
    <p className="font-bold text-white">
    Did this fit your style?
    </p>

    <div className="mt-4 grid grid-cols-3 gap-2">
    {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;

        return (
        <button
            key={option.value}
            type="button"
            disabled={loading || disabled}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-sm font-bold transition ${
            active
                ? "bg-purple-500 text-white"
                : "bg-white/[0.06] text-slate-300 hover:bg-white/10"
            } disabled:cursor-not-allowed disabled:opacity-50`}
        >
            <Icon size={18} />
            {option.label}
        </button>
        );
    })}
    </div>

    {value && (
    <p className="mt-3 text-center text-xs text-purple-200">
        Saved — this will affect future recommendations.
    </p>
    )}
</div>
);
}

export default RecommendationFeedback;