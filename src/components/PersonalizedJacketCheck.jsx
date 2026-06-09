import { Link } from "react-router-dom";
import { useState } from "react";
import useWeather from "../hooks/useWeather";
import WeatherCard from "./WeatherCard";
import RecommendationCard from "./RecommendationCard";
import TimeWindowSelect from "./TimeWindowSelect";
import { calculatePersonalizedRecommendation } from "../utils/calculatePersonalizedRecommendation";

function PersonalizedJacketCheck({ profile }) {
const [recommendation, setRecommendation] = useState(null);
const [timeWindow, setTimeWindow] = useState("rest_of_day");

const { weather, loading, error, fetchWeather } = useWeather();

const hasDefaultLocation =
profile?.default_location_lat && profile?.default_location_lon;

const defaultLocation = hasDefaultLocation
? {
    name: profile.default_location_name,
    region: profile.default_location_region,
    country: profile.default_location_country,
    lat: profile.default_location_lat,
    lon: profile.default_location_lon,
    }
: null;

const handlePersonalizedCheck = async () => {
if (!defaultLocation) return;

setRecommendation(null);

const weatherData = await fetchWeather(defaultLocation);

if (!weatherData) return;

const personalizedRecommendation = calculatePersonalizedRecommendation({
    weather: weatherData,
    profile,
    windowId: timeWindow,
});

setRecommendation(personalizedRecommendation);
};

return (
<section>
    <div className="mb-8">
    <p className="text-sm uppercase tracking-wide text-sky-400">
        Personalized Mode
    </p>

    <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        Your Jacket Recommendation
    </h1>

    <p className="mt-3 text-slate-300">
        Uses your saved profile, default location, and forecast window.
    </p>
    </div>

    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
    {defaultLocation ? (
        <div className="mb-5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
        Default location: {defaultLocation.name}, {defaultLocation.region},{" "}
        {defaultLocation.country}
        </div>
    ) : (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
        Save a default location in your profile first.
        </div>
    )}

    <TimeWindowSelect value={timeWindow} onChange={setTimeWindow} />

    <button
        type="button"
        onClick={handlePersonalizedCheck}
        disabled={!defaultLocation || loading}
        className="mt-5 w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
        {loading ? "Checking Your Forecast..." : "Run Personalized Check"}
    </button>

    <Link
        to="/profile"
        className="mt-3 block text-center text-sm font-medium text-sky-300 hover:text-sky-200"
    >
        Edit profile details
    </Link>
    </div>

    {error && (
    <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {error}
    </div>
    )}

    <div className="mt-6 space-y-5">
    <RecommendationCard recommendation={recommendation} />

    <WeatherCard weather={weather} recommendation={recommendation} />
    </div>
</section>
);
}

export default PersonalizedJacketCheck;