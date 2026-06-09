function WeatherCard({ weather, recommendation }) {
if (!weather) return null;

const forecastAnalysis = recommendation?.forecastAnalysis;
const upcomingPreview =
    forecastAnalysis?.windowHours?.slice(0, 4) ||
    weather.upcomingHours?.slice(0, 4) ||
    [];

return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 space-y-4">
    <div>
        <h3 className="text-lg font-semibold text-white">
        Current Weather in {weather.city}
        </h3>

        {(weather.region || weather.country) && (
        <p className="text-sm text-slate-400">
            {[weather.region, weather.country].filter(Boolean).join(", ")}
        </p>
        )}

        {forecastAnalysis?.windowLabel && (
        <p className="mt-2 text-sm text-sky-300">
            Analyzing: {forecastAnalysis.windowLabel}
        </p>
        )}
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
        <p>Temp: {Math.round(weather.temperature)}°F</p>
        <p>Feels: {Math.round(weather.feelsLike)}°F</p>
        <p>Wind: {Math.round(weather.windSpeed)} mph</p>
        <p>Rain: {weather.rainChance}%</p>
        <p>High: {Math.round(weather.dailyHigh)}°F</p>
        <p>Low: {Math.round(weather.dailyLow)}°F</p>
    </div>

    <p className="capitalize text-slate-300">
        Condition: {weather.condition}
    </p>

    {upcomingPreview.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 p-4">
        <p className="mb-2 text-sm font-medium text-white">
            Forecast window preview
        </p>

        <div className="space-y-1 text-sm text-slate-300">
            {upcomingPreview.map((hour) => (
            <div key={hour.time} className="flex justify-between gap-4">
                <span>{hour.time.split(" ")[1]}</span>
                <span>{Math.round(hour.feelsLike)}°F feels-like</span>
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