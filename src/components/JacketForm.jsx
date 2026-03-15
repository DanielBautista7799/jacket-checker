import { useState } from "react";
import { calculateJacketScore } from "../utils/calculateJacketScore";
import { mapScoreToRecommendation } from "../utils/mapScoreToRecommendation";
import useWeather from "../hooks/useWeather";
import WeatherCard from "./WeatherCard";
import RecommendationCard from "./RecommendationCard";

function JacketForm() {
const [city, setCity] = useState("");
const [duration, setDuration] = useState("");
const [tolerance, setTolerance] = useState("");
const [activity, setActivity] = useState("");
const [recommendation, setRecommendation] = useState("");

const { weather, loading, error, fetchWeather } = useWeather();

const handleSubmit = async (e) => {
e.preventDefault();

if (!city || !duration || !tolerance || !activity) {
    setRecommendation("Please fill out all fields first.");
    return;
}

setRecommendation("");
await fetchWeather(city);
};

const handleGenerateRecommendation = () => {
if (!weather) return;

const rainChance = 0;

const score = calculateJacketScore({
    feelsLike: weather.feelsLike,
    windSpeed: weather.windSpeed,
    rainChance,
    duration,
    tolerance,
    activity,
});

const result = mapScoreToRecommendation(score);
setRecommendation(result);
};

return (
<div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-5">
    <h2 className="text-2xl font-semibold text-white">
        Tell Us About Your Situation
    </h2>

    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
        City
        </label>
        <input
        type="text"
        placeholder="Enter a city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        />
    </div>

    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
        Time outside
        </label>
        <select
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        >
        <option value="">Select...</option>
        <option value="short">Less than 10 minutes</option>
        <option value="medium">10–30 minutes</option>
        <option value="long">30+ minutes</option>
        </select>
    </div>

    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
        Cold tolerance
        </label>
        <select
        value={tolerance}
        onChange={(e) => setTolerance(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        >
        <option value="">Select...</option>
        <option value="cold">Run cold</option>
        <option value="normal">Normal</option>
        <option value="hot">Run hot</option>
        </select>
    </div>

    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
        Activity level
        </label>
        <select
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        >
        <option value="">Select...</option>
        <option value="still">Standing still</option>
        <option value="walk">Walking</option>
        <option value="active">Active</option>
        </select>
    </div>

    <button
        type="submit"
        className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400"
    >
        {loading ? "Checking weather..." : "Check Recommendation"}
    </button>
    </form>

    {error && (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {error}
    </div>
    )}

    <WeatherCard
    weather={weather}
    onGenerateRecommendation={handleGenerateRecommendation}
    />

    <RecommendationCard recommendation={recommendation} />
</div>
);
}

export default JacketForm;