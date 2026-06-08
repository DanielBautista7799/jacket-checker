import { useState } from "react";
import { calculateJacketScore } from "../utils/calculateJacketScore";
import { mapScoreToRecommendation } from "../utils/mapScoreToRecommendation";
import useWeather from "../hooks/useWeather";
import LocationSearch from "./LocationSearch";
import WeatherCard from "./WeatherCard";
import RecommendationCard from "./RecommendationCard";

function JacketForm() {
const [selectedLocation, setSelectedLocation] = useState(null);
const [recommendation, setRecommendation] = useState(null);

const { weather, loading, error, fetchWeather } = useWeather();

const handleSubmit = async (e) => {
e.preventDefault();

if (!selectedLocation) return;

setRecommendation(null);

const weatherData = await fetchWeather(selectedLocation);

if (!weatherData) return;

const scoringResult = calculateJacketScore({
    weather: weatherData,
});

const mappedRecommendation = mapScoreToRecommendation(
    scoringResult.score,
    weatherData,
    scoringResult.forecastAnalysis
);

setRecommendation({
    ...mappedRecommendation,
    score: scoringResult.score,
    reasons: scoringResult.reasons,
    forecastAnalysis: scoringResult.forecastAnalysis,
});
};

return (
<div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-5">
    <h2 className="text-2xl font-semibold text-white">
        Should I Wear A Jacket?
    </h2>

    <LocationSearch
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
    />

    <button
        type="submit"
        disabled={!selectedLocation || loading}
        className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
        {loading ? "Checking Forecast..." : "Do I Need A Jacket?"}
    </button>
    </form>

    {error && (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {error}
    </div>
    )}


    <RecommendationCard recommendation={recommendation} />
    <WeatherCard weather={weather} />

</div>
);
}

export default JacketForm;