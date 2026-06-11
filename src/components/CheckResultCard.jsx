import {
AlertTriangle,
CheckCircle2,
CloudRain,
MapPin,
Shield,
Sparkles,
Thermometer,
Wind,
XCircle,
} from "lucide-react";

function CheckResultCard({ weather, recommendation, mode = "guest" }) {
const isPersonalized = mode === "personalized";

if (!weather && !recommendation) {
    return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
        <Shield className="mx-auto text-slate-600" size={42} />
        <p className="mt-4 font-semibold text-slate-300">
        Your jacket check will appear here.
        </p>
    </div>
    );
}

if (weather && !recommendation) {
    return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-slate-400">Checking forecast...</p>
    </div>
    );
}

const isYes = recommendation.decision === "YES";
const forecastAlerts = recommendation.forecastAnalysis?.alerts || [];
const bringAlongSuggestions =
    recommendation.forecastAnalysis?.bringAlongSuggestions || [];
const profileReasons = recommendation.profileReasons || [];

const topReasons = recommendation.reasons?.slice(0, 3) || [];
const topProfileReasons = profileReasons.slice(0, 3);

return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl">
    <div className="mb-6 flex items-start justify-between gap-4">
        <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {isPersonalized ? "Personalized Check" : "Jacket Check"}
        </p>

        <h3
            className={`mt-1 text-6xl font-black tracking-tight ${
            isYes ? "text-sky-300" : "text-emerald-300"
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
        {isYes ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
        </div>
    </div>

    <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-slate-400">Wear</p>

        <p className="mt-1 text-2xl font-black text-white">
        {recommendation.primaryItem}
        </p>

        <p className="mt-3 leading-6 text-slate-300">
        {recommendation.summary}
        </p>
    </div>

    {isPersonalized && topProfileReasons.length > 0 && (
        <div className="mb-5 rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
        <div className="mb-3 flex items-center gap-2 text-purple-200">
            <Sparkles size={18} />
            <p className="font-bold">Tuned For You</p>
        </div>

        <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {topProfileReasons.map((reason, index) => (
            <li key={index}>• {reason}</li>
            ))}
        </ul>
        </div>
    )}

    {bringAlongSuggestions.length > 0 && (
        <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
        <div className="mb-3 flex items-center gap-2 text-amber-200">
            <AlertTriangle size={18} />
            <p className="font-bold">Bring Along</p>
        </div>

        <div className="space-y-3">
            {bringAlongSuggestions.slice(0, 2).map((suggestion, index) => (
            <div key={`${suggestion.item}-${index}`}>
                <p className="font-bold text-white">{suggestion.item}</p>
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
            <p className="font-bold">Forecast Watch</p>
        </div>

        <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {forecastAlerts.slice(0, 2).map((alert, index) => (
            <li key={`${alert.type}-${index}`}>• {alert.message}</li>
            ))}
        </ul>
        </div>
    )}

    {topReasons.length > 0 && (
        <div className="mb-5 rounded-3xl bg-white/[0.03] p-5">
        <p className="mb-3 font-bold text-white">Why?</p>

        <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {topReasons.map((reason, index) => (
            <li key={index}>• {reason}</li>
            ))}
        </ul>
        </div>
    )}

    {weather && (
        <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Thermometer size={16} />
            Feels
            </div>
            <p className="text-xl font-black text-white">
            {Math.round(weather.feelsLike)}°F
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Wind size={16} />
            Wind
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
            {weather.rainChance}%
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