import { Link } from "react-router-dom";
import { useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import useWeather from "../hooks/useWeather";
import TimeWindowSelect from "./TimeWindowSelect";
import CheckResultCard from "./CheckResultCard";
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

const profileSummary = [
profile?.cold_tolerance && `Runs ${profile.cold_tolerance}`,
profile?.rain_sensitivity && `${profile.rain_sensitivity} rain sensitivity`,
profile?.wind_sensitivity && `${profile.wind_sensitivity} wind sensitivity`,
].filter(Boolean);

return (
<section>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
        Personalized
    </p>

    <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Your jacket check
    </h1>
    </div>

    <div className="mb-5 grid gap-3 sm:grid-cols-2">
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Default Location
        </p>

        {defaultLocation ? (
        <div className="flex items-center gap-2 text-sm text-sky-100">
            <MapPin size={17} />
            <span>
            {defaultLocation.name}, {defaultLocation.region}
            </span>
        </div>
        ) : (
        <div className="text-sm text-amber-200">
            Save a default location first.
        </div>
        )}
    </div>

    <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
        Profile Active
        </p>

        <div className="flex flex-wrap gap-2">
        {profileSummary.map((item) => (
            <span
            key={item}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
            >
            {item}
            </span>
        ))}
        </div>

        <Link
        to="/profile"
        className="mt-3 block text-sm font-bold text-sky-300 hover:text-sky-200"
        >
        Edit profile →
        </Link>
    </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
    <div className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="space-y-5">
        <TimeWindowSelect value={timeWindow} onChange={setTimeWindow} />

        <button
            type="button"
            onClick={handlePersonalizedCheck}
            disabled={!defaultLocation || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
            <Sparkles size={19} />
            {loading ? "Checking..." : "Run Personalized Check"}
        </button>
        </div>

        {error && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
        </div>
        )}
    </div>

    <CheckResultCard
        weather={weather}
        recommendation={recommendation}
        mode="personalized"
    />
    </div>
</section>
);
}

export default PersonalizedJacketCheck;