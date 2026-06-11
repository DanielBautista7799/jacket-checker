import { CloudSun, Droplets, MapPin, Thermometer, Wind } from "lucide-react";

function WeatherCard({ weather, recommendation }) {
if (!weather) {
return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
    <CloudSun className="mx-auto text-slate-600" size={42} />
    <p className="mt-4 font-semibold text-slate-300">
        Weather details will appear here.
    </p>
    <p className="mt-1 text-sm text-slate-500">
        Pick a location and run the check.
    </p>
    </div>
);
}

const forecastAnalysis = recommendation?.forecastAnalysis;
const upcomingPreview =
forecastAnalysis?.windowHours?.slice(0, 4) ||
weather.upcomingHours?.slice(0, 4) ||
[];

const statCards = [
{
    label: "Feels",
    value: `${Math.round(weather.feelsLike)}°F`,
    icon: Thermometer,
},
{
    label: "Wind",
    value: `${Math.round(weather.windSpeed)} mph`,
    icon: Wind,
},
{
    label: "Rain",
    value: `${weather.rainChance}%`,
    icon: Droplets,
},
{
    label: "Low",
    value: `${Math.round(weather.dailyLow)}°F`,
    icon: CloudSun,
},
];

return (
<div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-xl">
    <div className="mb-5 flex items-start justify-between gap-4">
    <div>
        <p className="flex items-center gap-2 text-sm text-slate-400">
        <MapPin size={16} />
        {[weather.city, weather.region, weather.country]
            .filter(Boolean)
            .join(", ")}
        </p>

        <h3 className="mt-2 text-3xl font-black text-white">
        {Math.round(weather.temperature)}°F
        </h3>

        <p className="mt-1 capitalize text-slate-300">{weather.condition}</p>
    </div>

    <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300">
        <CloudSun size={28} />
    </div>
    </div>

    {forecastAnalysis?.windowLabel && (
    <div className="mb-5 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sm text-sky-100">
        Analyzing: {forecastAnalysis.windowLabel}
    </div>
    )}

    <div className="grid grid-cols-2 gap-3">
    {statCards.map((stat) => {
        const Icon = stat.icon;

        return (
        <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
            <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Icon size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
                {stat.label}
            </span>
            </div>

            <p className="text-xl font-black text-white">{stat.value}</p>
        </div>
        );
    })}
    </div>

    {upcomingPreview.length > 0 && (
    <div className="mt-5 rounded-2xl bg-white/[0.03] p-4">
        <p className="mb-3 text-sm font-bold text-white">
        Forecast window preview
        </p>

        <div className="space-y-2">
        {upcomingPreview.map((hour) => (
            <div
            key={hour.time}
            className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/60 px-3 py-2 text-sm text-slate-300"
            >
            <span>{hour.time.split(" ")[1]}</span>
            <span>{Math.round(hour.feelsLike)}°F feels</span>
            <span>{Math.round(hour.rainChance)}% rain</span>
            </div>
        ))}
        </div>
    </div>
    )}
</div>
);
}

export default WeatherCard;