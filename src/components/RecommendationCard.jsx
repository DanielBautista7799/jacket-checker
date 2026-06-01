function RecommendationCard({ recommendation }) {
if (!recommendation) return null;

const isYes = recommendation.decision === "YES";
const forecastAlerts = recommendation.forecastAnalysis?.alerts || [];
const bringAlongSuggestions =
    recommendation.forecastAnalysis?.bringAlongSuggestions || [];

return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/90 p-6 shadow-2xl">
    <div className="mb-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">
        Jacket Verdict
        </p>

        <h3
        className={`mt-1 text-5xl font-black ${
            isYes ? "text-sky-300" : "text-emerald-300"
        }`}
        >
        {recommendation.decision}
        </h3>
    </div>

    <div className="mb-6 rounded-2xl bg-slate-900/70 p-5">
        <p className="text-sm text-slate-400">Current Recommendation</p>

        <p className="mt-1 text-2xl font-bold text-white">
        {recommendation.primaryItem}
        </p>

        <p className="mt-3 text-slate-300">{recommendation.summary}</p>
    </div>

    {bringAlongSuggestions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
        <p className="mb-3 font-semibold text-amber-200">
            Bring Along
        </p>

        <div className="space-y-3">
            {bringAlongSuggestions.map((suggestion, index) => (
            <div key={`${suggestion.item}-${index}`}>
                <p className="font-medium text-white">{suggestion.item}</p>
                <p className="text-sm text-slate-300">
                {suggestion.reason}
                </p>
            </div>
            ))}
        </div>
        </div>
    )}

    {forecastAlerts.length > 0 && (
        <div className="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
        <p className="mb-2 font-semibold text-sky-200">Forecast Watch</p>

        <ul className="space-y-1 text-sm text-slate-300">
            {forecastAlerts.map((alert, index) => (
            <li key={`${alert.type}-${index}`}>• {alert.message}</li>
            ))}
        </ul>
        </div>
    )}

    {recommendation.reasons?.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 p-5">
        <p className="mb-2 font-semibold text-white">Why?</p>

        <ul className="space-y-1 text-sm text-slate-300">
            {recommendation.reasons.map((reason, index) => (
            <li key={index}>• {reason}</li>
            ))}
        </ul>
        </div>
    )}
    </div>
);
}

export default RecommendationCard;