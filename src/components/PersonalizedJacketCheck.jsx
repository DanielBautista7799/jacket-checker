import { Link } from "react-router-dom";
import {
useEffect,
useMemo,
useRef,
useState,
} from "react";

import {
MapPin,
Shirt,
Sparkles,
} from "lucide-react";

import useAuth from "../hooks/useAuth";
import useClosetItems from "../hooks/useClosetItems";
import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useWeather from "../hooks/useWeather";

import {
buildRecommendationForClosetMatch,
calculatePersonalizedRecommendation,
} from "../utils/calculatePersonalizedRecommendation";

import { rankClosetItems } from "../utils/rankClosetItems";

import TimeWindowSelect from "./TimeWindowSelect";
import CheckResultCard from "./CheckResultCard";

const FEEDBACK_WEIGHTS = {
fire: 2,
good: 1,
not_it: -1,
};

function PersonalizedJacketCheck({
profile,
}) {
const { user } = useAuth();

const {
closetItems,
adjustTimesRecommended,
} = useClosetItems(user);

const {
learningLoading,
learningError,
saveRecommendation,
submitFeedback,
getFeedbackForRecommendation,
} = useRecommendationLearning(user);

const {
loading,
error,
fetchWeather,
} = useWeather();

const storageKey = useMemo(() => {
if (!user?.id) {
    return null;
}

return `jacket-check:last-personalized-result:${user.id}`;
}, [user?.id]);

const restoringRef = useRef(true);

const [recommendation, setRecommendation] =
useState(null);

const [resultWeather, setResultWeather] =
useState(null);

const [timeWindow, setTimeWindow] =
useState("rest_of_day");

const [
selectedRankIndex,
setSelectedRankIndex,
] = useState(0);

const [
rejectedItemIds,
setRejectedItemIds,
] = useState([]);

const [
feedbackSaving,
setFeedbackSaving,
] = useState(false);

const [localError, setLocalError] =
useState("");

const hasDefaultLocation =
profile?.default_location_lat !== null &&
profile?.default_location_lat !==
    undefined &&
profile?.default_location_lon !== null &&
profile?.default_location_lon !==
    undefined;

const defaultLocation =
hasDefaultLocation
    ? {
        name:
        profile.default_location_name,

        region:
        profile.default_location_region,

        country:
        profile.default_location_country,

        lat:
        profile.default_location_lat,

        lon:
        profile.default_location_lon,
    }
    : null;

useEffect(() => {
if (!storageKey) {
    restoringRef.current = false;
    return;
}

try {
    const saved =
    sessionStorage.getItem(
        storageKey
    );

    if (saved) {
    const parsed =
        JSON.parse(saved);

    setRecommendation(
        parsed.recommendation ||
        null
    );

    setResultWeather(
        parsed.weather || null
    );

    setTimeWindow(
        parsed.timeWindow ||
        "rest_of_day"
    );

    setSelectedRankIndex(
        parsed.selectedRankIndex ||
        0
    );

    setRejectedItemIds(
        parsed.rejectedItemIds ||
        []
    );
    }
} catch (restoreError) {
    console.error(
    "Could not restore personalized result:",
    restoreError
    );

    sessionStorage.removeItem(
    storageKey
    );
} finally {
    window.setTimeout(() => {
    restoringRef.current =
        false;
    }, 0);
}
}, [storageKey]);

useEffect(() => {
if (
    !storageKey ||
    !recommendation ||
    !resultWeather
) {
    return;
}

sessionStorage.setItem(
    storageKey,
    JSON.stringify({
    recommendation,
    weather: resultWeather,
    timeWindow,
    selectedRankIndex,
    rejectedItemIds,
    })
);
}, [
storageKey,
recommendation,
resultWeather,
timeWindow,
selectedRankIndex,
rejectedItemIds,
]);

const savedFeedback =
recommendation?.historyId
    ? getFeedbackForRecommendation(
        recommendation.historyId
    )
    : null;

const clearResult = () => {
if (storageKey) {
    sessionStorage.removeItem(
    storageKey
    );
}

setRecommendation(null);
setResultWeather(null);
setSelectedRankIndex(0);
setRejectedItemIds([]);
setLocalError("");
};

const handleTimeWindowChange = (
nextWindow
) => {
setTimeWindow(nextWindow);

if (
    !restoringRef.current &&
    recommendation
) {
    clearResult();
    setTimeWindow(nextWindow);
}
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
    rankedClosetMatches:
        rankedMatches,
    },

    closetMatch,

    weather: resultWeather,

    profile,

    rankedClosetMatches:
    rankedMatches,

    weatherNeeds:
    baseRecommendation.weatherNeeds,
});
};

const handlePersonalizedCheck =
async () => {
    if (!defaultLocation) {
    return;
    }

    setLocalError("");
    setRejectedItemIds([]);
    setSelectedRankIndex(0);

    const weatherData =
    await fetchWeather(
        defaultLocation
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
        preferenceModel: null,
    });

    setResultWeather(weatherData);

    setRecommendation({
    ...calculated,
    historyId: null,
    });
};

const selectRankedMatch = (
rankIndex
) => {
if (
    !recommendation ||
    !resultWeather
) {
    return;
}

const rankedMatches =
    recommendation.rankedClosetMatches ||
    [];

const selectedMatch =
    rankedMatches[rankIndex];

if (!selectedMatch) {
    return;
}

const nextRecommendation =
    createRecommendationFromMatch({
    baseRecommendation:
        recommendation,

    closetMatch:
        selectedMatch,

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
if (
    !recommendation ||
    !resultWeather
) {
    return null;
}

const ranking =
    rankClosetItems({
    closetItems:
        updatedClosetItems,

    weather:
        resultWeather,

    forecastAnalysis:
        recommendation.forecastAnalysis,

    profile,

    excludedItemIds:
        excludedIds,
    });

const rankedMatches =
    ranking.topMatches;

if (!rankedMatches.length) {
    return {
    ranking,
    recommendation: {
        ...recommendation,
        closetMatch: null,
        rankedClosetMatches: [],
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
        match.item.id ===
        keepItemId
    );

    if (matchingIndex >= 0) {
    selectedIndex =
        matchingIndex;
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
    },

    closetMatch:
        selectedMatch,

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

const handleFeedback = async (
rating
) => {
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
    FEEDBACK_WEIGHTS[
    previousRating
    ] || 0;

const nextWeight =
    FEEDBACK_WEIGHTS[rating] || 0;

const scoreDifference =
    nextWeight - previousWeight;

try {
    let historyId =
    recommendation.historyId;

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

    historyId =
        historyEntry.id;
    }

    const recommendationWithHistory =
    {
        ...recommendation,
        historyId,
    };

    const feedbackResult =
    await submitFeedback({
        recommendationId:
        historyId,

        recommendation:
        recommendationWithHistory,

        rating,
    });

    if (!feedbackResult) {
    return;
    }

    if (
    scoreDifference !== 0
    ) {
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
                item.times_recommended ||
                    0
                ) +
                scoreDifference,
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

    setRejectedItemIds(
        nextRejectedIds
    );

    const rebuilt =
        rebuildRankings({
        updatedClosetItems,

        excludedIds:
            nextRejectedIds,

        keepItemId: null,
        });

    if (
        rebuilt?.recommendation
    ) {
        setRecommendation(
        rebuilt.recommendation
        );

        setSelectedRankIndex(
        rebuilt.selectedIndex
        );
    }

    if (
        !rebuilt?.ranking
        ?.topMatches.length
    ) {
        setLocalError(
        "You rejected every available jacket for this check."
        );
    }
    } else {
    const rebuilt =
        rebuildRankings({
        updatedClosetItems,

        excludedIds:
            rejectedItemIds,

        keepItemId:
            currentItem.id,
        });

    if (
        rebuilt?.recommendation
    ) {
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
    closetItems.length === 1
    ? ""
    : "s"
}`,
].filter(Boolean);

const displayedError =
localError ||
error ||
learningError;

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
        Default Location
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
            Save a default location first.
        </div>
        )}
    </div>

    <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-200">
        Profile Active
        </p>

        <div className="flex flex-wrap gap-2">
        {profileSummary.map(
            (item) => (
            <span
                key={item}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-slate-200"
            >
                {item}
            </span>
            )
        )}
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
        <TimeWindowSelect
            value={timeWindow}
            onChange={
            handleTimeWindowChange
            }
        />

        <button
            type="button"
            onClick={
            handlePersonalizedCheck
            }
            disabled={
            !defaultLocation ||
            loading ||
            learningLoading ||
            feedbackSaving
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
            <Sparkles size={19} />

            {loading
            ? "Checking..."
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
        recommendation={
        recommendation
        }
        mode="personalized"
        feedbackValue={
        savedFeedback?.rating ||
        null
        }
        onFeedback={
        handleFeedback
        }
        feedbackLoading={
        feedbackSaving
        }
        rankedMatches={
        recommendation
            ?.rankedClosetMatches ||
        []
        }
        selectedRankIndex={
        selectedRankIndex
        }
        onSelectRank={
        selectRankedMatch
        }
    />
    </div>
</section>
);
}

export default PersonalizedJacketCheck;