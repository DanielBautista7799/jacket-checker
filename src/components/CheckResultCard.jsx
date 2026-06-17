import {
AlertTriangle,
CheckCircle2,
CloudRain,
MapPin,
Shield,
Shirt,
Thermometer,
Wind,
XCircle,
} from "lucide-react";

import RecommendationFeedback from "./RecommendationFeedback";

function formatLabel(value = "") {
return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
    character.toUpperCase()
    );
}

function CheckResultCard({
weather,
recommendation,
mode = "guest",
feedbackValue = null,
onFeedback,
feedbackLoading = false,
rankedMatches = [],
selectedRankIndex = 0,
onSelectRank,
}) {
const isPersonalized =
    mode === "personalized";

if (!weather && !recommendation) {
    return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
        <Shield
        className="mx-auto text-slate-600"
        size={42}
        />

        <p className="mt-4 font-semibold text-slate-300">
        Your jacket check will appear here.
        </p>
    </div>
    );
}

if (weather && !recommendation) {
    return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-slate-400">
        Checking forecast...
        </p>
    </div>
    );
}

const isYes =
    recommendation.decision === "YES";

const shouldShowCloset =
    isPersonalized && isYes;

const forecastAlerts =
    recommendation.forecastAnalysis?.alerts || [];

const bringAlongSuggestions =
    recommendation.forecastAnalysis
    ?.bringAlongSuggestions || [];

const optionalLayer =
    recommendation.optionalLayer || null;

const styleSuggestion =
    recommendation.styleSuggestion;

const closetMatch =
    recommendation.closetMatch;

const topReasons =
    recommendation.reasons?.slice(0, 3) || [];

return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl">
    <div className="mb-6 flex items-start justify-between gap-4">
        <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {isPersonalized
            ? "Personalized Check"
            : "Jacket Check"}
        </p>

        <h3
            className={`mt-1 text-6xl font-black tracking-tight ${
            isYes
                ? "text-sky-300"
                : "text-emerald-300"
            }`}
        >
            {recommendation.decision}
        </h3>
        </div>

        <div
        className={`rounded-2xl p-3 ${
            isYes
            ? "bg-sky-500/10 text-sky-300"
            : "bg-emerald-500/10 text-emerald-300"
        }`}
        >
        {isYes ? (
            <CheckCircle2 size={32} />
        ) : (
            <XCircle size={32} />
        )}
        </div>
    </div>

    <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-slate-400">
        {isYes ? "Wear" : "Decision"}
        </p>

        <p className="mt-1 text-2xl font-black text-white">
        {recommendation.primaryItem}
        </p>

        <p className="mt-3 leading-6 text-slate-300">
        {recommendation.summary}
        </p>
    </div>

    {!isYes && optionalLayer && (
        <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
        <div className="mb-3 flex items-center gap-2 text-amber-200">
            <Shirt size={18} />

            <p className="font-bold">
            Optional Light Layer
            </p>
        </div>

        <p className="font-black text-white">
            {optionalLayer.item}
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-300">
            {optionalLayer.reason}
        </p>
        </div>
    )}

    {shouldShowCloset &&
        rankedMatches.length > 0 && (
        <div className="mb-5 rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
            <p className="mb-4 font-bold text-purple-200">
            Top jacket matches
            </p>

            <div className="space-y-3">
            {rankedMatches.map(
                (match, index) => {
                const active =
                    index === selectedRankIndex;

                return (
                    <button
                    key={match.item.id}
                    type="button"
                    onClick={() =>
                        onSelectRank?.(index)
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        active
                        ? "border-purple-400/60 bg-purple-500/20"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                    }`}
                    >
                    {match.item.image_url ? (
                        <img
                        src={match.item.image_url}
                        alt={match.item.name}
                        className="h-16 w-16 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-slate-500">
                        <Shirt size={22} />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wide text-purple-300">
                        #{index + 1}
                        </p>

                        <p className="truncate font-black text-white">
                        {match.item.name}
                        </p>

                        <p className="text-xs text-slate-400">
                        {formatLabel(match.item.color)}{" "}
                        {formatLabel(match.item.type)}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-lg font-black text-white">
                        {match.score}
                        </p>

                        <p className="text-xs text-slate-500">
                        score
                        </p>
                    </div>
                    </button>
                );
                }
            )}
            </div>
        </div>
        )}

    {shouldShowCloset && closetMatch && (
        <div className="mb-5 overflow-hidden rounded-3xl border border-sky-400/20 bg-sky-400/10">
        {closetMatch.item.image_url && (
            <img
            src={closetMatch.item.image_url}
            alt={closetMatch.item.name}
            className="h-56 w-full object-cover"
            />
        )}

        <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sky-200">
            <Shirt size={18} />

            <p className="font-bold">
                Selected Closet Match
            </p>
            </div>

            <p className="text-xl font-black text-white">
            {closetMatch.item.name}
            </p>

            <p className="mt-1 text-sm text-slate-300">
            {formatLabel(closetMatch.item.color)}{" "}
            {formatLabel(closetMatch.item.type)}
            </p>

            <p className="mt-2 text-sm font-bold text-sky-200">
            Match score: {closetMatch.score}
            </p>

            <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
            {closetMatch.reasons
                .slice(0, 4)
                .map((reason, index) => (
                <li key={index}>• {reason}</li>
                ))}
            </ul>
        </div>
        </div>
    )}

    {shouldShowCloset && styleSuggestion && (
        <div className="mb-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
        <div className="mb-3 flex items-center gap-2 text-emerald-200">
            <Shirt size={18} />

            <p className="font-bold">Style It</p>
        </div>

        <p className="mb-3 font-bold text-white">
            {styleSuggestion.outfitTitle}
        </p>

        <div className="flex flex-wrap gap-2">
            {styleSuggestion.pieces?.map((piece) => (
            <span
                key={piece}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
            >
                {piece}
            </span>
            ))}
        </div>

        <p className="mt-3 text-sm leading-5 text-slate-300">
            {styleSuggestion.reason}
        </p>

        <p className="mt-2 text-sm leading-5 text-slate-400">
            {styleSuggestion.colorNote}
        </p>
        </div>
    )}

    {isYes &&
        bringAlongSuggestions.length > 0 && (
        <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-200">
            <AlertTriangle size={18} />

            <p className="font-bold">Bring Along</p>
            </div>

            <div className="space-y-3">
            {bringAlongSuggestions
                .slice(0, 2)
                .map((suggestion, index) => (
                <div
                    key={`${suggestion.item}-${index}`}
                >
                    <p className="font-bold text-white">
                    {suggestion.item}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-300">
                    {suggestion.reason}
                    </p>
                </div>
                ))}
            </div>
        </div>
        )}

    {forecastAlerts.length > 0 && (
        <div className="mb-5 rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
        <div className="mb-3 flex items-center gap-2 text-sky-200">
            <CloudRain size={18} />

            <p className="font-bold">
            Forecast Watch
            </p>
        </div>

        <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {forecastAlerts
            .slice(0, 2)
            .map((alert, index) => (
                <li
                key={`${alert.type}-${index}`}
                >
                • {alert.message}
                </li>
            ))}
        </ul>
        </div>
    )}

    {topReasons.length > 0 && (
        <div className="mb-5 rounded-3xl bg-white/[0.03] p-5">
        <p className="mb-3 font-bold text-white">
            Why?
        </p>

        <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {topReasons.map((reason, index) => (
            <li key={index}>• {reason}</li>
            ))}
        </ul>
        </div>
    )}

    {shouldShowCloset && onFeedback && (
        <div className="mb-5">
        <RecommendationFeedback
            value={feedbackValue}
            onChange={onFeedback}
            loading={feedbackLoading}
            disabled={false}
        />
        </div>
    )}

    {weather && (
        <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Thermometer size={16} />
            Current feels
            </div>

            <p className="text-xl font-black text-white">
            {Math.round(weather.feelsLike)}°F
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Wind size={16} />
            Current wind
            </div>

            <p className="text-xl font-black text-white">
            {Math.round(weather.windSpeed)} mph
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <CloudRain size={16} />
            Rain
            </div>

            <p className="text-xl font-black text-white">
            {Math.round(
                recommendation.forecastAnalysis
                ?.highestWindowRainChance ??
                weather.rainChance
            )}
            %
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <MapPin size={16} />
            Location
            </div>

            <p className="truncate text-sm font-bold text-white">
            {weather.city}
            </p>
        </div>
        </div>
    )}
    </div>
);
}

export default CheckResultCard;