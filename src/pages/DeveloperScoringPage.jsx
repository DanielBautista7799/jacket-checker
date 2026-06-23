import {
  Bug,
  MapPin,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import DeveloperScoreCard from "../components/DeveloperScoreCard";
import DiagnosticJsonPanel from "../components/DiagnosticJsonPanel";
import JacketScoreBreakdown from "../components/JacketScoreBreakdown";
import LocationSearch from "../components/LocationSearch";
import RecommendationDecisionBreakdown from "../components/RecommendationDecisionBreakdown";
import RecommendationScenarioRunner from "../components/RecommendationScenarioRunner";
import TimeWindowSelect from "../components/TimeWindowSelect";
import VisualIntelligenceDiagnostics from "../components/VisualIntelligenceDiagnostics";
import TrendDiagnostics from "../components/TrendDiagnostics";
import useProfile from "../hooks/useProfile";
import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useStyleTrends from "../hooks/useStyleTrends";
import useWardrobeItems from "../hooks/useWardrobeItems";
import useWeather from "../hooks/useWeather";
import { calculatePersonalizedRecommendation } from "../utils/calculatePersonalizedRecommendation.js";

function buildDefaultLocation(profile) {
  const hasCoordinates =
    profile?.default_location_lat !== null &&
    profile?.default_location_lat !== undefined &&
    profile?.default_location_lon !== null &&
    profile?.default_location_lon !== undefined;

  if (!hasCoordinates) {
    return null;
  }

  return {
    name: profile.default_location_name,
    region: profile.default_location_region,
    country: profile.default_location_country,
    lat: profile.default_location_lat,
    lon: profile.default_location_lon,
  };
}

function DeveloperScoringPage() {
  const { profile, profileLoading, profileError } = useProfile();
  const {
    wardrobeItems,
    activeJacketItems,
    wardrobeLoading,
    wardrobeError,
  } = useWardrobeItems();
  const { preferenceModel, learningError } =
    useRecommendationLearning();
  const {
    rules: activeTrendRules,
    trendPreferenceModel,
    trendSource,
    trendError,
  } = useStyleTrends();
  const { fetchWeather, loading, error } = useWeather();

  const defaultLocation = useMemo(
    () => buildDefaultLocation(profile),
    [profile]
  );

  const [selectedLocationOverride, setSelectedLocationOverride] =
    useState(undefined);
  const [timeWindow, setTimeWindow] =
    useState("rest_of_day");
  const [recommendation, setRecommendation] = useState(null);
  const [resultWeather, setResultWeather] = useState(null);
  const [localError, setLocalError] = useState("");

  const selectedLocation =
    selectedLocationOverride === undefined
      ? defaultLocation
      : selectedLocationOverride;

  const clearResult = () => {
    setRecommendation(null);
    setResultWeather(null);
    setLocalError("");
  };

  const handleLocationChange = (location) => {
    setSelectedLocationOverride(location);
    clearResult();
  };

  const handleTimeWindowChange = (nextWindow) => {
    setTimeWindow(nextWindow);
    clearResult();
  };

  const useDefaultLocation = () => {
    setSelectedLocationOverride(undefined);
    clearResult();
  };

  const runDiagnostic = async () => {
    if (!selectedLocation) {
      setLocalError(
        "Choose a location or save a default profile location first."
      );
      return;
    }

    setLocalError("");
    setRecommendation(null);
    setResultWeather(null);

    const weatherData = await fetchWeather(selectedLocation, {
      background: false,
    });

    if (!weatherData) {
      return;
    }

    const calculated = calculatePersonalizedRecommendation({
      weather: weatherData,
      profile,
      windowId: timeWindow,
      closetItems: wardrobeItems,
      preferenceModel,
      location: selectedLocation,
      activeTrendRules,
      trendPreferenceModel,
      trendSource,
    });

    setResultWeather(weatherData);
    setRecommendation(calculated);
  };

  const displayedError =
    localError ||
    error ||
    profileError ||
    wardrobeError ||
    learningError ||
    trendError;

  const selectedLocationIsDefault =
    defaultLocation &&
    selectedLocation &&
    Number(defaultLocation.lat) === Number(selectedLocation.lat) &&
    Number(defaultLocation.lon) === Number(selectedLocation.lon);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
        <div className="flex items-start gap-3">
          <Bug size={24} className="mt-1 shrink-0 text-purple-200" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
              Developer-only diagnostics
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
              Recommendation scoring panel
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-300">
              This route runs the same production recommendation engine used
              by personalized mode, but it does not save history, increment
              counters, submit feedback, or modify jacket data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Diagnostic input
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {activeJacketItems.length} active jacket
                {activeJacketItems.length === 1 ? "" : "s"} loaded
              </p>
            </div>

            {recommendation && (
              <button
                type="button"
                onClick={clearResult}
                className="text-sm font-black text-slate-400 transition hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {defaultLocation && (
            <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-sky-100">
                  <MapPin size={16} />
                  <span>
                    Saved: {defaultLocation.name}
                    {defaultLocation.region
                      ? `, ${defaultLocation.region}`
                      : ""}
                  </span>
                </div>

                {!selectedLocationIsDefault && (
                  <button
                    type="button"
                    onClick={useDefaultLocation}
                    className="flex items-center gap-1 text-xs font-black text-sky-200"
                  >
                    <RotateCcw size={13} />
                    Restore
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <LocationSearch
              selectedLocation={selectedLocation}
              onSelectLocation={handleLocationChange}
            />

            <TimeWindowSelect
              value={timeWindow}
              onChange={handleTimeWindowChange}
            />

            <button
              type="button"
              onClick={runDiagnostic}
              disabled={
                !selectedLocation ||
                loading ||
                profileLoading ||
                wardrobeLoading
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-4 font-black text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <PlayCircle size={19} />
              {loading ? "Running engine..." : "Run diagnostic check"}
            </button>
          </div>

          {displayedError && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {displayedError}
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
            <ShieldAlert size={17} className="mt-1 shrink-0" />
            <span>
              Leave VITE_ENABLE_DEV_SCORING disabled in public production
              unless Phase 13 adds server-enforced admin access.
            </span>
          </div>
        </div>

        <DeveloperScoreCard
          recommendation={recommendation}
          diagnostics={recommendation?.diagnostics || null}
          weather={resultWeather}
        />
      </div>

      {recommendation?.diagnostics && (
        <>
          <RecommendationDecisionBreakdown
            diagnostics={recommendation.diagnostics}
          />
          <JacketScoreBreakdown
            diagnostics={recommendation.diagnostics}
          />
          <VisualIntelligenceDiagnostics
            diagnostics={recommendation.diagnostics}
          />
          <TrendDiagnostics
            diagnostics={recommendation.diagnostics}
          />
          <DiagnosticJsonPanel
            diagnostics={recommendation.diagnostics}
          />
        </>
      )}

      <RecommendationScenarioRunner />
    </section>
  );
}

export default DeveloperScoringPage;
