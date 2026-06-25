import { CloudRain, CloudSun, Wind } from "lucide-react";

function formatHour(value = "") {
  const time = String(value).split(" ")[1] || value;
  const [rawHour, minute = "00"] = time.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minute} ${suffix}`;
}

export default function ForecastStrip({ weather, recommendation, hours: explicitHours = null, highlightedWindow = "" }) {
  const hours = explicitHours || recommendation?.forecastAnalysis?.windowHours || weather?.upcomingHours || weather?.forecastHours || [];
  const visible = hours.slice(0, 8);
  if (!visible.length) return null;

  return (
    <section aria-labelledby="forecast-strip-title" className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id="forecast-strip-title" className="text-sm font-extrabold text-white">Forecast window</h3>
        {(highlightedWindow || recommendation?.forecastAnalysis?.windowLabel) && <span className="text-xs font-bold text-slate-500">{highlightedWindow || recommendation.forecastAnalysis.windowLabel}</span>}
      </div>
      <div className="scrollbar-subtle -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {visible.map((hour, index) => {
          const rain = Number(hour.rainChance) || 0;
          const wind = Number(hour.windSpeed) || 0;
          const Icon = rain >= 40 ? CloudRain : wind >= 15 ? Wind : CloudSun;
          return (
            <article key={`${hour.time || index}-${index}`} className={`min-w-[7.25rem] snap-start rounded-2xl border p-3 ${index === 0 ? "border-cyan-300/24 bg-cyan-400/[0.07]" : "border-slate-400/12 bg-white/[0.03]"}`}>
              <p className="text-xs font-extrabold text-slate-400">{formatHour(hour.time)}</p>
              <Icon size={19} className="mt-3 text-cyan-200" aria-hidden="true" />
              <p className="font-display mt-2 text-lg font-bold text-white">{Math.round(hour.feelsLike ?? hour.temperature ?? 0)}°</p>
              <p className="mt-1 text-[0.7rem] font-bold text-slate-500">{rain}% rain</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
