function WeatherCard({ weather, onGenerateRecommendation }) {
if (!weather) return null;

return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 space-y-3">
    <h3 className="text-lg font-semibold text-white">
        Current Weather in {weather.city}
    </h3>

    <p className="text-slate-200">Temperature: {weather.temperature}°F</p>
    <p className="text-slate-200">Feels like: {weather.feelsLike}°F</p>
    <p className="text-slate-200">Wind speed: {weather.windSpeed} mph</p>
    <p className="text-slate-200 capitalize">
        Condition: {weather.description}
    </p>

    <button
        type="button"
        onClick={onGenerateRecommendation}
        className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400"
    >
        Generate Jacket Recommendation
    </button>
    </div>
);
}

export default WeatherCard;