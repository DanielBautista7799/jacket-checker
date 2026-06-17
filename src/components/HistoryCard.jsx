import {
Clock,
CloudRain,
MapPin,
Shirt,
Trash2,
Wind,
} from "lucide-react";

function formatDate(value) {
return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
}).format(new Date(value));
}

function formatLabel(value = "") {
return value.replaceAll("_", " ");
}

function HistoryCard({
entry,
feedback,
onDelete,
deleting = false,
}) {
const weather = entry.weather_snapshot || {};
const outfit = entry.outfit_json || null;

return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
    <div className="flex items-start justify-between gap-4">
        <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Clock size={14} />
            {formatDate(entry.created_at)}
        </div>

        <div className="mt-3 flex items-center gap-3">
            <span
            className={`text-3xl font-black ${
                entry.decision === "YES"
                ? "text-sky-300"
                : "text-emerald-300"
            }`}
            >
            {entry.decision}
            </span>

            <div>
            <p className="font-black text-white">
                {entry.jacket_name}
            </p>

            <p className="text-sm capitalize text-slate-400">
                {formatLabel(entry.time_window)}
            </p>
            </div>
        </div>
        </div>

        <button
        type="button"
        disabled={deleting}
        onClick={() => onDelete(entry.id)}
        className="rounded-xl bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        aria-label="Delete history entry"
        >
        <Trash2 size={17} />
        </button>
    </div>

    {entry.summary && (
        <p className="mt-4 text-sm leading-6 text-slate-300">
        {entry.summary}
        </p>
    )}

    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {weather.city && (
        <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
            <MapPin size={13} />
            {weather.city}
        </span>
        )}

        {weather.feelsLike !== null &&
        weather.feelsLike !== undefined && (
            <span className="rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
            Feels {Math.round(weather.feelsLike)}°F
            </span>
        )}

        {weather.rainChance !== null &&
        weather.rainChance !== undefined && (
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
            <CloudRain size={13} />
            {weather.rainChance}%
            </span>
        )}

        {weather.windSpeed !== null &&
        weather.windSpeed !== undefined && (
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
            <Wind size={13} />
            {Math.round(weather.windSpeed)} mph
            </span>
        )}
    </div>

    {outfit?.pieces?.length > 0 && (
        <div className="mt-5 rounded-2xl bg-emerald-400/10 p-4">
        <div className="flex items-center gap-2 font-bold text-emerald-200">
            <Shirt size={16} />
            Outfit
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
            {outfit.pieces.map((piece) => (
            <span
                key={piece}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
            >
                {piece}
            </span>
            ))}
        </div>
        </div>
    )}

    {feedback && (
        <p className="mt-4 text-sm font-bold capitalize text-purple-300">
        Your rating: {feedback.rating.replaceAll("_", " ")}
        </p>
    )}
    </article>
);
}

export default HistoryCard;