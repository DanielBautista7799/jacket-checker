import { CloudSun, Droplets, MapPin, Thermometer, Wind } from "lucide-react";
import EmptyState from "./ui/EmptyState";
import GlassCard from "./ui/GlassCard";
import Badge from "./ui/Badge";
import ForecastStrip from "./ForecastStrip";
import WeatherMetric from "./WeatherMetric";

export default function WeatherCard({ weather, recommendation }) {
  if (!weather) {
    return (
      <EmptyState
        icon={CloudSun}
        title="Weather details will appear here"
        description="Choose a location and run the jacket check."
      />
    );
  }

  const forecastAnalysis = recommendation?.forecastAnalysis;
  const upcomingPreview =
    forecastAnalysis?.windowHours?.slice(0, 6) ||
    weather.upcomingHours?.slice(0, 6) ||
    [];

  return (
    <GlassCard as="article" className="overflow-hidden p-0" aria-labelledby="weather-card-title">
      <div className="relative p-5 sm:p-6">
        <div aria-hidden="true" className="storm-glow -right-24 -top-28 bg-cyan-300/14" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-400">
              <MapPin size={16} aria-hidden="true" />
              {[weather.city, weather.region, weather.country].filter(Boolean).join(", ")}
            </p>
            <h2
              id="weather-card-title"
              className="font-display mt-3 text-5xl font-bold tracking-[-0.055em] text-white sm:text-6xl"
            >
              {Math.round(weather.temperature)}°
            </h2>
            <p className="mt-1 capitalize text-slate-300">{weather.condition}</p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-cyan-200/15 bg-cyan-300/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
            <CloudSun size={28} aria-hidden="true" />
          </span>
        </div>

        {forecastAnalysis?.windowLabel && (
          <Badge variant="info" className="relative mt-5">
            Analyzing {forecastAnalysis.windowLabel}
          </Badge>
        )}

        <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <WeatherMetric icon={Thermometer} label="Feels like" value={`${Math.round(weather.feelsLike)}°F`} />
          <WeatherMetric icon={Wind} label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
          <WeatherMetric icon={Droplets} label="Rain" value={`${Math.round(weather.rainChance || 0)}%`} />
          <WeatherMetric icon={CloudSun} label="Daily low" value={`${Math.round(weather.dailyLow)}°F`} />
        </div>
      </div>

      {upcomingPreview.length > 0 && (
        <div className="border-t border-slate-400/10 bg-black/10 px-5 py-5 sm:px-6">
          <ForecastStrip hours={upcomingPreview} highlightedWindow={forecastAnalysis?.windowLabel} />
        </div>
      )}
    </GlassCard>
  );
}
