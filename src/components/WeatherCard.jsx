import { CloudSun, Droplets, MapPin, Thermometer, Wind } from "lucide-react";
import EmptyState from "./ui/EmptyState";

export default function WeatherCard({ weather, recommendation }) {
  if (!weather) {
    return <EmptyState icon={CloudSun} title="Weather details will appear here" description="Choose a location and run the jacket check." />;
  }

  const forecastAnalysis = recommendation?.forecastAnalysis;
  const upcomingPreview = forecastAnalysis?.windowHours?.slice(0, 4) || weather.upcomingHours?.slice(0, 4) || [];
  const statCards = [
    { label: "Feels", value: `${Math.round(weather.feelsLike)}°F`, icon: Thermometer },
    { label: "Wind", value: `${Math.round(weather.windSpeed)} mph`, icon: Wind },
    { label: "Rain", value: `${weather.rainChance}%`, icon: Droplets },
    { label: "Low", value: `${Math.round(weather.dailyLow)}°F`, icon: CloudSun },
  ];

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-xl" aria-labelledby="weather-card-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={16} aria-hidden="true" />{[weather.city, weather.region, weather.country].filter(Boolean).join(", ")}</p>
          <h2 id="weather-card-title" className="mt-2 text-3xl font-black text-white">{Math.round(weather.temperature)}°F</h2>
          <p className="mt-1 capitalize text-slate-300">{weather.condition}</p>
        </div>
        <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300"><CloudSun size={28} aria-hidden="true" /></div>
      </div>

      {forecastAnalysis?.windowLabel && <div className="mb-5 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sm text-sky-100">Analyzing: {forecastAnalysis.windowLabel}</div>}

      <dl className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><dt className="mb-2 flex items-center gap-2 text-slate-400"><Icon size={16} aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-wide">{stat.label}</span></dt><dd className="text-xl font-black text-white">{stat.value}</dd></div>;
        })}
      </dl>

      {upcomingPreview.length > 0 && (
        <section className="mt-5 rounded-2xl bg-white/[0.03] p-4" aria-labelledby="forecast-preview-title">
          <h3 id="forecast-preview-title" className="mb-3 text-sm font-black text-white">Forecast window preview</h3>
          <div className="space-y-2">{upcomingPreview.map((hour) => <div key={hour.time} className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 px-3 py-2 text-sm text-slate-300"><span>{hour.time.split(" ")[1]}</span><span>{Math.round(hour.feelsLike)}°F feels</span><span>{Math.round(hour.rainChance)}% rain</span></div>)}</div>
        </section>
      )}
    </article>
  );
}
