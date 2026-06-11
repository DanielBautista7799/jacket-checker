import { useState } from "react";
import { SearchCheck } from "lucide-react";
import { calculateJacketScore } from "../utils/calculateJacketScore";
import { mapScoreToRecommendation } from "../utils/mapScoreToRecommendation";
import useWeather from "../hooks/useWeather";
import LocationSearch from "./LocationSearch";
import TimeWindowSelect from "./TimeWindowSelect";
import CheckResultCard from "./CheckResultCard";

function JacketForm() {
const [selectedLocation, setSelectedLocation] = useState(null);
const [timeWindow, setTimeWindow] = useState("rest_of_day");
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
    windowId: timeWindow,
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
<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
    <form
    onSubmit={handleSubmit}
    className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-5"
    >
    <div className="space-y-5">
        <LocationSearch
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        />

        <TimeWindowSelect value={timeWindow} onChange={setTimeWindow} />

        <button
        type="submit"
        disabled={!selectedLocation || loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
        <SearchCheck size={20} />
        {loading ? "Checking..." : "Check Jacket"}
        </button>
    </div>

    {error && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {error}
        </div>
    )}
    </form>

    <CheckResultCard
    weather={weather}
    recommendation={recommendation}
    mode="guest"
    />
</div>
);
}

export default JacketForm;