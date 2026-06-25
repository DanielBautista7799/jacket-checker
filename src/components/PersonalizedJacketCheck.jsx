import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  MapPin,
  RotateCcw,
  Shirt,
  Sparkles,
} from "lucide-react";

import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useAnalytics from "../hooks/useAnalytics";
import useStyleTrends from "../hooks/useStyleTrends";
import useWardrobeItems from "../hooks/useWardrobeItems";
import useWeather from "../hooks/useWeather";

import {
  buildRecommendationForClosetMatch,
  calculatePersonalizedRecommendation,
} from "../utils/calculatePersonalizedRecommendation";
import { rankClosetItems } from "../utils/rankClosetItems";
import { createOperationTimer, getSafeErrorCode } from "../utils/analyticsEvents";

import CheckResultCard from "./CheckResultCard";
import LocationSearch from "./LocationSearch";
import TimeWindowSelect from "./TimeWindowSelect";
import Alert from "./ui/Alert";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import PageHeader from "./ui/PageHeader";

const FEEDBACK_WEIGHTS = {
  fire: 2,
  good: 1,
  not_it: -1,
};

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

function getPreferenceScore(item) {
  const value =
    item?.preference_score ?? item?.times_recommended ?? 0;

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function syncRecommendationWithJackets({
  recommendation,
  activeJacketItems,
  weather,
  profile,
  preferenceModel,
  activeTrendRules,
  trendPreferenceModel,
  trendSource,
}) {
  if (!recommendation) {
    return null;
  }

  if (recommendation.decision !== "YES") {
    return recommendation;
  }

  const jacketById = new Map(
    activeJacketItems.map((item) => [item.id, item])
  );

  const refreshMatch = (match) => {
    if (!match?.item?.id) {
      return match;
    }

    const currentItem = jacketById.get(match.item.id);

    if (!currentItem) {
      return null;
    }

    return currentItem === match.item
      ? match
      : {
          ...match,
          item: currentItem,
        };
  };

  const nextJacketMatch = refreshMatch(
    recommendation.closetMatch
  );

  const nextRankedMatches = (
    recommendation.rankedClosetMatches || []
  )
    .map(refreshMatch)
    .filter(Boolean)
    .slice(0, 3);

  const nextAllRankedMatches = (
    recommendation.allRankedClosetMatches || []
  )
    .map(refreshMatch)
    .filter(Boolean);

  const currentMatchWasRemoved =
    Boolean(recommendation.closetMatch?.item?.id) &&
    !nextJacketMatch;

  const selectedMatch =
    nextJacketMatch || nextRankedMatches[0] || null;

  const rebuilt = buildRecommendationForClosetMatch({
    recommendationBase: {
      ...recommendation,
      closetMatch: null,
      rankedClosetMatches: nextRankedMatches,
      allRankedClosetMatches: nextAllRankedMatches,
      historyId: currentMatchWasRemoved
        ? null
        : recommendation.historyId,
    },
    closetMatch: selectedMatch,
    weather,
    profile,
    rankedClosetMatches: nextRankedMatches,
    weatherNeeds: recommendation.weatherNeeds,
    preferenceModel,
    activeTrendRules,
    trendPreferenceModel,
    trendSource,
  });

  return {
    ...rebuilt,
    historyId: currentMatchWasRemoved
      ? null
      : recommendation.historyId,
  };
}

function PersonalizedJacketCheck({ profile }) {
  const { track } = useAnalytics();
  const {
    activeJacketItems,
    wardrobeLoading,
    adjustPreferenceScore,
  } = useWardrobeItems();

  const {
    preferenceModel,
    learningError,
    saveRecommendation,
    submitFeedback,
    getFeedbackForRecommendation,
  } = useRecommendationLearning();

  const {
    rules: activeTrendRules,
    trendPreferenceModel,
    trendSource,
    trendError,
  } = useStyleTrends();

  const {
    loading,
    error,
    fetchWeather,
  } = useWeather();

  const defaultLocation = useMemo(
    () => buildDefaultLocation(profile),
    [profile]
  );

  const [selectedLocationOverride, setSelectedLocationOverride] =
    useState(undefined);

  const selectedLocation =
    selectedLocationOverride === undefined
      ? defaultLocation
      : selectedLocationOverride;

  const [recommendation, setRecommendation] =
    useState(null);
  const [resultWeather, setResultWeather] = useState(null);
  const [timeWindow, setTimeWindow] =
    useState("rest_of_day");
  const [selectedRankIndex, setSelectedRankIndex] =
    useState(0);
  const [rejectedItemIds, setRejectedItemIds] =
    useState([]);
  const [feedbackSaving, setFeedbackSaving] =
    useState(false);
  const [localError, setLocalError] = useState("");

  const activeRecommendation = useMemo(
    () =>
      syncRecommendationWithJackets({
        recommendation,
        activeJacketItems,
        weather: resultWeather,
        profile,
        preferenceModel,
        activeTrendRules,
        trendPreferenceModel,
        trendSource,
      }),
    [
      recommendation,
      activeJacketItems,
      resultWeather,
      profile,
      preferenceModel,
      activeTrendRules,
      trendPreferenceModel,
      trendSource,
    ]
  );

  const displayedRankIndex = useMemo(() => {
    const currentItemId =
      activeRecommendation?.closetMatch?.item?.id;

    if (!currentItemId) {
      return 0;
    }

    const index = (
      activeRecommendation.rankedClosetMatches || []
    ).findIndex((match) => match.item.id === currentItemId);

    return index >= 0 ? index : selectedRankIndex;
  }, [activeRecommendation, selectedRankIndex]);

  const savedFeedback = activeRecommendation?.historyId
    ? getFeedbackForRecommendation(
        activeRecommendation.historyId
      )
    : null;

  const clearResult = () => {
    setRecommendation(null);
    setResultWeather(null);
    setSelectedRankIndex(0);
    setRejectedItemIds([]);
    setLocalError("");
  };

  const handleLocationChange = (location) => {
    setSelectedLocationOverride(location);
    clearResult();
  };

  const handleTimeWindowChange = (nextWindow) => {
    setTimeWindow(nextWindow);
    clearResult();
    track("personalized_forecast_window_changed", {
      experienceMode: "personalized",
      metadata: { forecast_window: nextWindow },
    });
  };

  const useDefaultLocation = () => {
    if (!defaultLocation) {
      return;
    }

    setSelectedLocationOverride(undefined);
    clearResult();
  };

  const createRecommendationFromMatch = ({
    baseRecommendation,
    jacketMatch,
    rankedMatches,
  }) =>
    buildRecommendationForClosetMatch({
      recommendationBase: {
        ...baseRecommendation,
        historyId: null,
        closetMatch: null,
        rankedClosetMatches: rankedMatches,
      },
      closetMatch: jacketMatch,
      weather: resultWeather,
      profile,
      rankedClosetMatches: rankedMatches,
      weatherNeeds: baseRecommendation.weatherNeeds,
      preferenceModel,
      activeTrendRules,
      trendPreferenceModel,
      trendSource,
    });

  const handlePersonalizedCheck = async () => {
    const finishTimer = createOperationTimer();
    if (!selectedLocation) {
      setLocalError(
        "Choose a location or use your current location first."
      );
      return;
    }

    setLocalError("");
    track("personalized_check_started", {
      experienceMode: "personalized",
      metadata: {
        forecast_window: timeWindow,
        location_source: selectedLocation?.source === "browser" ? "browser" : "search",
        jacket_count: activeJacketItems.length,
      },
    });
    setRecommendation(null);
    setResultWeather(null);
    setRejectedItemIds([]);
    setSelectedRankIndex(0);

    const weatherData = await fetchWeather(selectedLocation, {
      background: false,
    });

    if (!weatherData) {
      track("personalized_check_failed", {
        experienceMode: "personalized",
        success: false,
        durationMs: finishTimer(),
        metadata: { forecast_window: timeWindow, error_code: "weather_error" },
      });
      return;
    }

    const calculated = calculatePersonalizedRecommendation({
      weather: weatherData,
      profile,
      windowId: timeWindow,
      closetItems: activeJacketItems,
      preferenceModel,
      location: selectedLocation,
      activeTrendRules,
      trendPreferenceModel,
      trendSource,
    });

    setResultWeather(weatherData);
    setRecommendation({
      ...calculated,
      historyId: null,
    });

    track("personalized_check_completed", {
      experienceMode: "personalized",
      durationMs: finishTimer(),
      metadata: {
        forecast_window: timeWindow,
        decision: calculated.decision,
        jacket_subtype: calculated.closetMatch?.item?.subtype || "none",
        confidence: calculated.confidence?.label || calculated.confidence || "unknown",
        eligible_jackets: calculated.allRankedClosetMatches?.length || 0,
        trend_applied: Boolean(calculated.styleSuggestion?.trend?.applied),
        similarity_applied: Boolean(calculated.visualIntelligence?.diversityApplied),
      },
    });
  };

  const selectRankedMatch = (rankIndex) => {
    if (!activeRecommendation || !resultWeather) {
      return;
    }

    const rankedMatches =
      activeRecommendation.rankedClosetMatches || [];
    const selectedMatch = rankedMatches[rankIndex];

    if (!selectedMatch) {
      return;
    }

    const nextRecommendation = createRecommendationFromMatch({
      baseRecommendation: activeRecommendation,
      jacketMatch: selectedMatch,
      rankedMatches,
    });

    track("alternate_jacket_selected", {
      experienceMode: "personalized",
      metadata: { rank_index: rankIndex, jacket_subtype: selectedMatch.item?.subtype || "unknown" },
    });
    setSelectedRankIndex(rankIndex);
    setRecommendation({
      ...nextRecommendation,
      historyId: null,
    });
  };

  const rebuildRankings = ({
    updatedJacketItems,
    excludedIds,
    keepItemId = null,
  }) => {
    if (!activeRecommendation || !resultWeather) {
      return null;
    }

    const ranking = rankClosetItems({
      closetItems: updatedJacketItems,
      weather: resultWeather,
      forecastAnalysis:
        activeRecommendation.forecastAnalysis,
      profile,
      preferenceModel,
      excludedItemIds: excludedIds,
    });

    const rankedMatches = ranking.topMatches;

    if (!rankedMatches.length) {
      const nextRecommendation =
        buildRecommendationForClosetMatch({
          recommendationBase: {
            ...activeRecommendation,
            historyId: null,
            closetMatch: null,
            rankedClosetMatches: [],
            allRankedClosetMatches: [],
            weatherNeeds: ranking.weatherNeeds,
            primaryItem:
              activeRecommendation.jacketType || "Jacket",
          },
          closetMatch: null,
          weather: resultWeather,
          profile,
          rankedClosetMatches: [],
          weatherNeeds: ranking.weatherNeeds,
          preferenceModel,
          activeTrendRules,
          trendPreferenceModel,
          trendSource,
        });

      return {
        ranking,
        recommendation: nextRecommendation,
        selectedIndex: 0,
      };
    }

    let selectedIndex = 0;

    if (keepItemId) {
      const matchingIndex = rankedMatches.findIndex(
        (match) => match.item.id === keepItemId
      );

      if (matchingIndex >= 0) {
        selectedIndex = matchingIndex;
      }
    }

    const selectedMatch = rankedMatches[selectedIndex];

    const nextRecommendation = createRecommendationFromMatch({
      baseRecommendation: {
        ...activeRecommendation,
        weatherNeeds: ranking.weatherNeeds,
        allRankedClosetMatches: ranking.rankedItems,
      },
      jacketMatch: selectedMatch,
      rankedMatches,
    });

    return {
      ranking,
      recommendation: {
        ...nextRecommendation,
        historyId: null,
      },
      selectedIndex,
    };
  };

  const handleFeedback = async (rating) => {
    if (
      !activeRecommendation ||
      !activeRecommendation.closetMatch ||
      feedbackSaving
    ) {
      return;
    }

    setFeedbackSaving(true);
    setLocalError("");

    const currentItem = activeRecommendation.closetMatch.item;
    const previousRating = savedFeedback?.rating || null;
    const previousWeight = FEEDBACK_WEIGHTS[previousRating] || 0;
    const nextWeight = FEEDBACK_WEIGHTS[rating] || 0;
    const scoreDifference = nextWeight - previousWeight;

    try {
      let historyId = activeRecommendation.historyId;

      if (!historyId) {
        const historyEntry = await saveRecommendation({
          recommendation: activeRecommendation,
          weather: resultWeather,
          timeWindow,
        });

        if (!historyEntry) {
          setLocalError(
            "Could not save this recommendation."
          );
          return;
        }

        historyId = historyEntry.id;
      }

      const recommendationWithHistory = {
        ...activeRecommendation,
        historyId,
      };

      track(savedFeedback?.rating ? "jacket_feedback_changed" : "jacket_feedback_submitted", {
        experienceMode: "personalized",
        metadata: {
          feedback_type: rating,
          rating_changed: Boolean(savedFeedback?.rating),
          jacket_subtype: currentItem.subtype || "unknown",
        },
      });

      const feedbackResult = await submitFeedback({
        recommendationId: historyId,
        recommendation: recommendationWithHistory,
        rating,
        timeWindow,
      });

      if (!feedbackResult) {
        return;
      }

      if (scoreDifference !== 0) {
        const updated = await adjustPreferenceScore(
          currentItem.id,
          scoreDifference
        );

        if (!updated) {
          setLocalError(
            "Feedback saved, but the preference score could not be updated."
          );
          return;
        }
      }

      const updatedJacketItems = activeJacketItems.map((item) => {
        if (item.id !== currentItem.id) {
          return item;
        }

        const nextPreferenceScore =
          getPreferenceScore(item) + scoreDifference;

        return {
          ...item,
          preference_score: nextPreferenceScore,
          times_recommended: nextPreferenceScore,
        };
      });

      if (rating === "not_it") {
        const nextRejectedIds = [
          ...new Set([
            ...rejectedItemIds,
            currentItem.id,
          ]),
        ];

        setRejectedItemIds(nextRejectedIds);

        const rebuilt = rebuildRankings({
          updatedJacketItems,
          excludedIds: nextRejectedIds,
          keepItemId: null,
        });

        if (rebuilt?.recommendation) {
          setRecommendation(rebuilt.recommendation);
          setSelectedRankIndex(rebuilt.selectedIndex);
        }

        if (!rebuilt?.ranking?.topMatches.length) {
          setLocalError(
            "You rejected every available jacket for this check."
          );
        }
      } else {
        const rebuilt = rebuildRankings({
          updatedJacketItems,
          excludedIds: rejectedItemIds,
          keepItemId: currentItem.id,
        });

        if (rebuilt?.recommendation) {
          setRecommendation({
            ...rebuilt.recommendation,
            historyId,
          });
          setSelectedRankIndex(rebuilt.selectedIndex);
        }
      }
    } catch (feedbackError) {
      track("edge_function_error", { experienceMode: "personalized", success: false, metadata: { error_code: getSafeErrorCode(feedbackError), operation: "feedback" } });
      console.error(
        "Could not process feedback:",
        feedbackError
      );

      setLocalError(
        feedbackError.message ||
          "Could not update this recommendation."
      );
    } finally {
      setFeedbackSaving(false);
    }
  };

  const profileSummary = [
    profile?.cold_tolerance
      ? `Runs ${profile.cold_tolerance}`
      : null,
    profile?.style_preference
      ? profile.style_preference.replaceAll("_", " ")
      : null,
    `${activeJacketItems.length} active jacket${
      activeJacketItems.length === 1 ? "" : "s"
    }`,
  ].filter(Boolean);

  const displayedError =
    localError || error || learningError || trendError;

  const selectedLocationIsDefault =
    defaultLocation &&
    selectedLocation &&
    Number(defaultLocation.lat) ===
      Number(selectedLocation.lat) &&
    Number(defaultLocation.lon) ===
      Number(selectedLocation.lon);

  return (
    <section className="page-enter mx-auto w-full space-y-6" aria-labelledby="personalized-check-title">
      <PageHeader
        eyebrow="Today"
        title="Your jacket check"
        description="Choose where you are going and when. The recommendation uses your comfort profile and the jackets you own."
        actions={activeRecommendation ? <Button type="button" variant="ghost" size="sm" onClick={clearResult}>Clear result</Button> : null}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4" soft>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Saved default</p>
          {defaultLocation ? (
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-cyan-100"><MapPin size={17} aria-hidden="true" /><span>{defaultLocation.name}{defaultLocation.region ? `, ${defaultLocation.region}` : ""}</span></div>
          ) : <p className="mt-3 text-sm font-bold text-amber-200">No default location saved.</p>}
        </Card>

        <Card className="p-4" soft>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-200/75">Profile active</p>
          <div className="mt-3 flex flex-wrap gap-2">{profileSummary.map((item) => <Badge key={item} tone="purple" className="capitalize">{item}</Badge>)}</div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-extrabold">
            <Link to="/profile" viewTransition className="text-cyan-300 hover:text-cyan-200">Edit profile →</Link>
            <Link to="/wardrobe" viewTransition className="text-emerald-300 hover:text-emerald-200">Wardrobe →</Link>
            <Link to="/history" viewTransition className="text-violet-300 hover:text-violet-200">History →</Link>
          </div>
        </Card>
      </div>

      {activeJacketItems.length === 0 && (
        <Alert tone="warning"><span className="inline-flex items-center gap-2"><Shirt size={17} aria-hidden="true" />Add an active jacket so personalized mode can recommend one you own.</span></Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.18fr)] lg:items-start">
        <Card className="h-fit min-w-0 p-5 sm:p-6" elevated>
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Set today’s forecast</p>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-slate-200">Check location</p>
                {defaultLocation && !selectedLocationIsDefault && (
                  <button type="button" onClick={useDefaultLocation} className="flex items-center gap-1 text-xs font-extrabold text-cyan-300 transition hover:text-cyan-200"><RotateCcw size={13} aria-hidden="true" />Use saved default</button>
                )}
              </div>
              <LocationSearch selectedLocation={selectedLocation} onSelectLocation={handleLocationChange} analyticsMode="personalized" />
            </div>
            <TimeWindowSelect value={timeWindow} onChange={handleTimeWindowChange} />
            <Button
              type="button"
              size="lg"
              onClick={handlePersonalizedCheck}
              loading={loading || wardrobeLoading}
              loadingLabel={loading ? "Building your recommendation" : "Loading jackets"}
              disabled={!selectedLocation || feedbackSaving}
              className="w-full"
            >
              <Sparkles size={19} aria-hidden="true" />
              {loading ? "Building your recommendation…" : wardrobeLoading ? "Loading jackets…" : "Run personalized check"}
            </Button>
          </div>
          {displayedError && <div className="mt-5"><Alert tone="error">{displayedError}</Alert></div>}
        </Card>

        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <CheckResultCard
            weather={resultWeather}
            recommendation={activeRecommendation}
            mode="personalized"
            loading={loading}
            feedbackValue={savedFeedback?.rating || null}
            onFeedback={handleFeedback}
            feedbackLoading={feedbackSaving}
            rankedMatches={activeRecommendation?.rankedClosetMatches || []}
            selectedRankIndex={displayedRankIndex}
            onSelectRank={selectRankedMatch}
          />
        </div>
      </div>
    </section>
  );
}

export default PersonalizedJacketCheck;
