import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import {
MapPin,
RotateCcw,
Shirt,
Sparkles,
} from "lucide-react";

import useClosetItems from "../hooks/useClosetItems";
import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useWeather from "../hooks/useWeather";

import {
buildRecommendationForClosetMatch,
calculatePersonalizedRecommendation,
} from "../utils/calculatePersonalizedRecommendation";

import { rankClosetItems } from "../utils/rankClosetItems";

import LocationSearch from "./LocationSearch";
import TimeWindowSelect from "./TimeWindowSelect";
import CheckResultCard from "./CheckResultCard";

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

function PersonalizedJacketCheck({ profile }) {
const {
closetItems,
closetLoading,
adjustTimesRecommended,
} = useClosetItems();

const {
preferenceModel,
learningError,
saveRecommendation,
submitFeedback,
getFeedbackForRecommendation,
} = useRecommendationLearning();

const {
loading,
error,
fetchWeather,
} = useWeather();

const defaultLocation = useMemo(
() => buildDefaultLocation(profile),
[
    profile?.default_location_name,
    profile?.default_location_region,
    profile?.default_location_country,
    profile?.default_location_lat,
    profile?.default_location_lon,
]
);

const [selectedLocation, setSelectedLocation] =
useState(defaultLocation);

const [recommendation, setRecommendation] =
useState(null);

const [resultWeather, setResultWeather] =
useState(null);

const [timeWindow, setTimeWindow] =
useState("rest_of_day");

const [selectedRankIndex, setSelectedRankIndex] =
useState(0);

const [rejectedItemIds, setRejectedItemIds] =
useState([]);

const [feedbackSaving, setFeedbackSaving] =
useState(false);

const [localError, setLocalError] =
useState("");

useEffect(() => {
setSelectedLocation((current) => {
    if (current) {
    return current;
    }

    return defaultLocation;
});
}, [defaultLocation]);

useEffect(() => {
if (!recommendation || closetItems.length === 0) {
    return;
}

const itemById = new Map(
    closetItems.map((item) => [item.id, item])
);

const refreshMatch = (match) => {
    if (!match?.item?.id) {
    return match;
    }

    const currentItem = itemById.get(match.item.id);

    if (!currentItem || currentItem === match.item) {
    return match;
    }

    return {
    ...match,
    item: currentItem,
    };
};

setRecommendation((current) => {
    if (!current) {
    return current;
    }

    const nextClosetMatch = refreshMatch(
    current.closetMatch
    );

    const nextRankedMatches = (
    current.rankedClosetMatches || []
    ).map(refreshMatch);

    const nextAllRankedMatches = (
    current.allRankedClosetMatches || []
    ).map(refreshMatch);

    const closetMatchChanged =
    nextClosetMatch !== current.closetMatch;

    const rankedChanged = nextRankedMatches.some(
    (match, index) =>
        match !== current.rankedClosetMatches?.[index]
    );

    const allRankedChanged =
    nextAllRankedMatches.some(
        (match, index) =>
        match !==
        current.allRankedClosetMatches?.[index]
    );

    if (
    !closetMatchChanged &&
    !rankedChanged &&
    !allRankedChanged
    ) {
    return current;
    }

    return {
    ...current,
    closetMatch: nextClosetMatch,
    rankedClosetMatches: nextRankedMatches,
    allRankedClosetMatches:
        nextAllRankedMatches,
    };
});
}, [closetItems, recommendation?.closetMatch?.item?.id]);

const savedFeedback =
recommendation?.historyId
    ? getFeedbackForRecommendation(
        recommendation.historyId
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
setSelectedLocation(location);
clearResult();
};

const handleTimeWindowChange = (nextWindow) => {
setTimeWindow(nextWindow);
clearResult();
};

const useDefaultLocation = () => {
if (!defaultLocation) {
    return;
}

setSelectedLocation(defaultLocation);
clearResult();
};

const createRecommendationFromMatch = ({
baseRecommendation,
closetMatch,
rankedMatches,
}) => {
return buildRecommendationForClosetMatch({
    recommendationBase: {
    ...baseRecommendation,
    historyId: null,
    closetMatch: null,
    styleSuggestion: null,
    rankedClosetMatches: rankedMatches,
    },
    closetMatch,
    weather: resultWeather,
    profile,
    rankedClosetMatches: rankedMatches,
    weatherNeeds:
    baseRecommendation.weatherNeeds,
});
};

const handlePersonalizedCheck = async () => {
if (!selectedLocation) {
    setLocalError(
    "Choose a location or use your current location first."
    );
    return;
}

setLocalError("");
setRecommendation(null);
setResultWeather(null);
setRejectedItemIds([]);
setSelectedRankIndex(0);

const weatherData = await fetchWeather(
    selectedLocation,
    {
    background: false,
    }
);

if (!weatherData) {
    return;
}

const calculated =
    calculatePersonalizedRecommendation({
    weather: weatherData,
    profile,
    windowId: timeWindow,
    closetItems,
    preferenceModel,
    });

setResultWeather(weatherData);

setRecommendation({
    ...calculated,
    historyId: null,
});
};

const selectRankedMatch = (rankIndex) => {
if (!recommendation || !resultWeather) {
    return;
}

const rankedMatches =
    recommendation.rankedClosetMatches || [];

const selectedMatch =
    rankedMatches[rankIndex];

if (!selectedMatch) {
    return;
}

const nextRecommendation =
    createRecommendationFromMatch({
    baseRecommendation: recommendation,
    closetMatch: selectedMatch,
    rankedMatches,
    });

setSelectedRankIndex(rankIndex);

setRecommendation({
    ...nextRecommendation,
    historyId: null,
});
};

const rebuildRankings = ({
updatedClosetItems,
excludedIds,
keepItemId = null,
}) => {
if (!recommendation || !resultWeather) {
    return null;
}

const ranking = rankClosetItems({
    closetItems: updatedClosetItems,
    weather: resultWeather,
    forecastAnalysis:
    recommendation.forecastAnalysis,
    profile,
    preferenceModel,
    excludedItemIds: excludedIds,
});

const rankedMatches = ranking.topMatches;

if (!rankedMatches.length) {
    return {
    ranking,
    recommendation: {
        ...recommendation,
        closetMatch: null,
        rankedClosetMatches: [],
        allRankedClosetMatches: [],
        historyId: null,
        primaryItem:
        recommendation.jacketType ||
        "No jacket",
    },
    selectedIndex: 0,
    };
}

let selectedIndex = 0;

if (keepItemId) {
    const matchingIndex =
    rankedMatches.findIndex(
        (match) =>
        match.item.id === keepItemId
    );

    if (matchingIndex >= 0) {
    selectedIndex = matchingIndex;
    }
}

const selectedMatch =
    rankedMatches[selectedIndex];

const nextRecommendation =
    createRecommendationFromMatch({
    baseRecommendation: {
        ...recommendation,
        weatherNeeds:
        ranking.weatherNeeds,
        allRankedClosetMatches:
        ranking.rankedItems,
    },
    closetMatch: selectedMatch,
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
    !recommendation ||
    !recommendation.closetMatch ||
    feedbackSaving
) {
    return;
}

setFeedbackSaving(true);
setLocalError("");

const currentItem =
    recommendation.closetMatch.item;

const previousRating =
    savedFeedback?.rating || null;

const previousWeight =
    FEEDBACK_WEIGHTS[previousRating] || 0;

const nextWeight =
    FEEDBACK_WEIGHTS[rating] || 0;

const scoreDifference =
    nextWeight - previousWeight;

try {
    let historyId = recommendation.historyId;

    if (!historyId) {
    const historyEntry =
        await saveRecommendation({
        recommendation,
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
    ...recommendation,
    historyId,
    };

    const feedbackResult =
    await submitFeedback({
        recommendationId: historyId,
        recommendation:
        recommendationWithHistory,
        rating,
    });

    if (!feedbackResult) {
    return;
    }

    if (scoreDifference !== 0) {
    const updated =
        await adjustTimesRecommended(
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

    const updatedClosetItems =
    closetItems.map((item) =>
        item.id === currentItem.id
        ? {
            ...item,
            times_recommended:
                Number(
                item.times_recommended || 0
                ) + scoreDifference,
            }
        : item
    );

    if (rating === "not_it") {
    const nextRejectedIds = [
        ...new Set([
        ...rejectedItemIds,
        currentItem.id,
        ]),
    ];

    setRejectedItemIds(nextRejectedIds);

    const rebuilt = rebuildRankings({
        updatedClosetItems,
        excludedIds: nextRejectedIds,
        keepItemId: null,
    });

    if (rebuilt?.recommendation) {
        setRecommendation(
        rebuilt.recommendation
        );

        setSelectedRankIndex(
        rebuilt.selectedIndex
        );
    }

    if (!rebuilt?.ranking?.topMatches.length) {
        setLocalError(
        "You rejected every available jacket for this check."
        );
    }
    } else {
    const rebuilt = rebuildRankings({
        updatedClosetItems,
        excludedIds: rejectedItemIds,
        keepItemId: currentItem.id,
    });

    if (rebuilt?.recommendation) {
        setRecommendation({
        ...rebuilt.recommendation,
        historyId,
        });

        setSelectedRankIndex(
        rebuilt.selectedIndex
        );
    }
    }
} catch (feedbackError) {
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
    ? profile.style_preference.replaceAll(
        "_",
        " "
    )
    : null,

`${closetItems.length} closet item${
    closetItems.length === 1 ? "" : "s"
}`,
].filter(Boolean);

const displayedError =
localError || error || learningError;

const selectedLocationIsDefault =
defaultLocation &&
selectedLocation &&
Number(defaultLocation.lat) ===
    Number(selectedLocation.lat) &&
Number(defaultLocation.lon) ===
    Number(selectedLocation.lon);

return (
<section>
    <div className="mb-6 flex items-end justify-between gap-4">
    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
        Personalized
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Your jacket check
        </h1>
    </div>

    {recommendation && (
        <button
        type="button"
        onClick={clearResult}
        className="text-sm font-bold text-slate-400 transition hover:text-white"
        >
        Clear result
        </button>
    )}
    </div>

    <div className="mb-5 grid gap-3 sm:grid-cols-2">
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Saved Default
        </p>

        {defaultLocation ? (
        <div className="flex items-center gap-2 text-sm text-sky-100">
            <MapPin size={17} />

            <span>
            {defaultLocation.name}
            {defaultLocation.region
                ? `, ${defaultLocation.region}`
                : ""}
            </span>
        </div>
        ) : (
        <div className="text-sm text-amber-200">
            No default location saved.
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
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-slate-200"
            >
            {item}
            </span>
        ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
        <Link
            to="/profile"
            className="text-sky-300 hover:text-sky-200"
        >
            Edit profile →
        </Link>

        <Link
            to="/closet"
            className="text-emerald-300 hover:text-emerald-200"
        >
            Closet →
        </Link>

        <Link
            to="/history"
            className="text-purple-300 hover:text-purple-200"
        >
            History →
        </Link>
        </div>
    </div>
    </div>

    {closetItems.length === 0 && (
    <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        <div className="flex items-center gap-2">
        <Shirt size={17} />

        <span>
            Add jackets so personalized mode can recommend items you own.
        </span>
        </div>
    </div>
    )}

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
    <div className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="space-y-5">
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-200">
                Check location
            </p>

            {defaultLocation &&
                !selectedLocationIsDefault && (
                <button
                    type="button"
                    onClick={useDefaultLocation}
                    className="flex items-center gap-1 text-xs font-bold text-sky-300 transition hover:text-sky-200"
                >
                    <RotateCcw size={13} />
                    Use saved default
                </button>
                )}
            </div>

            <LocationSearch
            selectedLocation={selectedLocation}
            onSelectLocation={
                handleLocationChange
            }
            />
        </div>

        <TimeWindowSelect
            value={timeWindow}
            onChange={handleTimeWindowChange}
        />

        <button
            type="button"
            onClick={handlePersonalizedCheck}
            disabled={
            !selectedLocation ||
            loading ||
            closetLoading ||
            feedbackSaving
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
            <Sparkles size={19} />

            {loading
            ? "Checking..."
            : closetLoading
                ? "Loading closet..."
                : "Run Personalized Check"}
        </button>
        </div>

        {displayedError && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {displayedError}
        </div>
        )}
    </div>

    <CheckResultCard
        weather={resultWeather}
        recommendation={recommendation}
        mode="personalized"
        feedbackValue={
        savedFeedback?.rating || null
        }
        onFeedback={handleFeedback}
        feedbackLoading={feedbackSaving}
        rankedMatches={
        recommendation?.rankedClosetMatches || []
        }
        selectedRankIndex={selectedRankIndex}
        onSelectRank={selectRankedMatch}
    />
    </div>
</section>
);
}

export default PersonalizedJacketCheck;
