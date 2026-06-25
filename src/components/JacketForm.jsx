import { useState } from "react";
import { SearchCheck } from "lucide-react";
import { calculateJacketScore } from "../utils/calculateJacketScore";
import { mapScoreToRecommendation } from "../utils/mapScoreToRecommendation";
import { getProtectionOverride } from "../utils/calculatePersonalizedRecommendation";
import { createOperationTimer, getSafeErrorCode } from "../utils/analyticsEvents";
import useWeather from "../hooks/useWeather";
import useAnalytics from "../hooks/useAnalytics";
import LocationSearch from "./LocationSearch";
import TimeWindowSelect from "./TimeWindowSelect";
import CheckResultCard from "./CheckResultCard";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Card from "./ui/Card";

export default function JacketForm() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeWindow, setTimeWindow] = useState("rest_of_day");
  const [recommendation, setRecommendation] = useState(null);
  const [validationError, setValidationError] = useState("");
  const { weather, loading, error, fetchWeather, clearWeather } = useWeather();
  const { track } = useAnalytics();

  const clearResult = () => { setRecommendation(null); clearWeather(); };
  const handleLocationChange = (location) => { setSelectedLocation(location); setValidationError(""); clearResult(); };
  const handleTimeWindowChange = (nextWindow) => { setTimeWindow(nextWindow); clearResult(); track("guest_forecast_window_changed", { metadata: { forecast_window: nextWindow } }); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedLocation) { setValidationError("Choose a location before running the check."); return; }
    const finishTimer = createOperationTimer();
    setValidationError("");
    setRecommendation(null);
    track("guest_check_started", { metadata: { forecast_window: timeWindow, location_source: selectedLocation.source === "browser" ? "browser" : "search" } });
    try {
      const weatherData = await fetchWeather(selectedLocation);
      if (!weatherData) throw new Error(error || "Weather request failed.");
      const scoringResult = calculateJacketScore({ weather: weatherData, windowId: timeWindow });
      const mappedRecommendation = mapScoreToRecommendation(scoringResult.score, weatherData, scoringResult.forecastAnalysis);
      const protectionResult = getProtectionOverride({
        mappedRecommendation,
        weather: weatherData,
        forecastAnalysis: scoringResult.forecastAnalysis,
      });
      const next = {
        ...protectionResult.recommendation,
        score: scoringResult.score,
        reasons: [
          ...scoringResult.reasons,
          ...(protectionResult.reason ? [protectionResult.reason] : []),
        ],
        forecastAnalysis: scoringResult.forecastAnalysis,
        selectedConditions: scoringResult.selectedConditions,
        confidence: scoringResult.confidence,
        protectionOverride: {
          applied: protectionResult.applied,
          rainRequired: protectionResult.rainRequired,
          windRequired: protectionResult.windRequired,
          winterPrecipitation: protectionResult.winterPrecipitation,
          originalDecision: protectionResult.originalDecision,
          reason: protectionResult.reason,
        },
      };
      setRecommendation(next);
      track("guest_check_completed", { durationMs: finishTimer(), metadata: { forecast_window: timeWindow, decision: next.decision, weather_category: scoringResult.forecastAnalysis?.temperatureBand || "unknown" } });
    } catch (checkError) {
      track("guest_check_failed", { success: false, durationMs: finishTimer(), metadata: { forecast_window: timeWindow, error_code: getSafeErrorCode(checkError) } });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
      <Card as="form" onSubmit={handleSubmit} className="h-fit p-5 sm:p-6" elevated>
        <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Set your forecast</p>
        <div className="space-y-5">
          <LocationSearch selectedLocation={selectedLocation} onSelectLocation={handleLocationChange} analyticsMode="guest" />
          <TimeWindowSelect value={timeWindow} onChange={handleTimeWindowChange} />
          <Button type="submit" size="lg" loading={loading} loadingLabel="Checking the forecast" disabled={!selectedLocation} className="w-full">
            <SearchCheck size={20} aria-hidden="true" />{loading ? "Checking the forecast…" : "Check jacket"}
          </Button>
        </div>
        {(validationError || error) && <div className="mt-5"><Alert tone="error">{validationError || error}</Alert></div>}
      </Card>
      <div aria-live="polite" aria-atomic="true">
        <CheckResultCard weather={weather} recommendation={recommendation} mode="guest" loading={loading} />
      </div>
    </div>
  );
}
