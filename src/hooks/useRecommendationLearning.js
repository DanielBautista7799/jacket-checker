import {
useCallback,
useEffect,
useMemo,
useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import { buildPreferenceModel } from "../utils/buildPreferenceModel";

const learningMemoryCache = new Map();

function getLearningCacheKey(userId) {
return `jacket-check:learning:${userId}`;
}

function readLearningCache(userId) {
if (!userId) {
    return {
    history: [],
    feedback: [],
    };
}

if (learningMemoryCache.has(userId)) {
    return learningMemoryCache.get(userId);
}

try {
    const saved = localStorage.getItem(
    getLearningCacheKey(userId)
    );

    if (!saved) {
    return {
        history: [],
        feedback: [],
    };
    }

    const parsed = JSON.parse(saved);

    const result = {
    history: parsed.history || [],
    feedback: parsed.feedback || [],
    };

    learningMemoryCache.set(
    userId,
    result
    );

    return result;
} catch (error) {
    console.error(
    "Could not read learning cache:",
    error
    );

    return {
    history: [],
    feedback: [],
    };
}
}

function writeLearningCache(
userId,
history,
feedback
) {
if (!userId) {
    return;
}

const value = {
    history,
    feedback,
};

learningMemoryCache.set(
    userId,
    value
);

try {
    localStorage.setItem(
    getLearningCacheKey(userId),
    JSON.stringify(value)
    );
} catch (error) {
    console.error(
    "Could not write learning cache:",
    error
    );
}
}

function createWeatherSnapshot(weather) {
if (!weather) {
    return {};
}

return {
    city: weather.city || null,
    feelsLike:
    weather.feelsLike ?? null,
    temperature:
    weather.temperature ?? null,
    windSpeed:
    weather.windSpeed ?? null,
    rainChance:
    weather.rainChance ?? null,
    condition:
    weather.condition || null,
};
}

function createOutfitSnapshot(
styleSuggestion
) {
if (!styleSuggestion) {
    return null;
}

return {
    outfitTitle:
    styleSuggestion.outfitTitle ||
    null,

    jacketStyle:
    styleSuggestion.jacketStyle ||
    null,

    pieces:
    styleSuggestion.pieces || [],

    top:
    styleSuggestion.top || null,

    bottoms:
    styleSuggestion.bottoms || null,

    shoes:
    styleSuggestion.shoes || null,

    accessory:
    styleSuggestion.accessory || null,

    colorNote:
    styleSuggestion.colorNote || null,

    reason:
    styleSuggestion.reason || null,
};
}

function useRecommendationLearning(user) {
const cachedData = readLearningCache(
    user?.id
);

const [history, setHistory] =
    useState(cachedData.history);

const [feedback, setFeedback] =
    useState(cachedData.feedback);

const [
    learningLoading,
    setLearningLoading,
] = useState(false);

const [
    learningRefreshing,
    setLearningRefreshing,
] = useState(false);

const [
    learningError,
    setLearningError,
] = useState("");

const preferenceModel = useMemo(
    () => buildPreferenceModel(feedback),
    [feedback]
);

const updateLearningState =
    useCallback(
    ({
        nextHistory,
        nextFeedback,
    }) => {
        setHistory((currentHistory) => {
        const resolvedHistory =
            typeof nextHistory ===
            "function"
            ? nextHistory(
                currentHistory
                )
            : nextHistory ??
                currentHistory;

        setFeedback(
            (currentFeedback) => {
            const resolvedFeedback =
                typeof nextFeedback ===
                "function"
                ? nextFeedback(
                    currentFeedback
                    )
                : nextFeedback ??
                    currentFeedback;

            if (user?.id) {
                writeLearningCache(
                user.id,
                resolvedHistory,
                resolvedFeedback
                );
            }

            return resolvedFeedback;
            }
        );

        return resolvedHistory;
        });
    },
    [user?.id]
    );

const fetchLearningData =
    useCallback(
    async ({
        silent = false,
    } = {}) => {
        if (!user) {
        setHistory([]);
        setFeedback([]);
        setLearningLoading(false);

        return {
            history: [],
            feedback: [],
        };
        }

        const cached =
        readLearningCache(user.id);

        if (
        silent ||
        cached.history.length > 0 ||
        cached.feedback.length > 0
        ) {
        setLearningRefreshing(true);
        } else {
        setLearningLoading(true);
        }

        setLearningError("");

        try {
        const [
            historyResponse,
            feedbackResponse,
        ] = await Promise.all([
            supabase
            .from(
                "recommendation_history"
            )
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .order("created_at", {
                ascending: false,
            })
            .limit(100),

            supabase
            .from("style_feedback")
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .order("created_at", {
                ascending: false,
            }),
        ]);

        if (
            historyResponse.error
        ) {
            throw historyResponse.error;
        }

        if (
            feedbackResponse.error
        ) {
            throw feedbackResponse.error;
        }

        const nextHistory =
            historyResponse.data || [];

        const nextFeedback =
            feedbackResponse.data || [];

        setHistory(nextHistory);
        setFeedback(nextFeedback);

        writeLearningCache(
            user.id,
            nextHistory,
            nextFeedback
        );

        return {
            history: nextHistory,
            feedback: nextFeedback,
        };
        } catch (error) {
        console.error(
            "Could not load recommendation learning:",
            error
        );

        setLearningError(
            error.message ||
            "Could not load recommendation history."
        );

        return cached;
        } finally {
        setLearningLoading(false);
        setLearningRefreshing(false);
        }
    },
    [user]
    );

const saveRecommendation =
    async ({
    recommendation,
    weather,
    timeWindow,
    }) => {
    if (!user || !recommendation) {
        return null;
    }

    setLearningError("");

    const closetItem =
        recommendation.closetMatch
        ?.item || null;

    const payload = {
        user_id: user.id,

        closet_item_id:
        closetItem?.id || null,

        decision:
        recommendation.decision,

        jacket_name:
        recommendation.primaryItem ||
        "No jacket",

        jacket_color:
        closetItem?.color || null,

        summary:
        recommendation.summary ||
        null,

        time_window: timeWindow,

        outfit_json:
        createOutfitSnapshot(
            recommendation.styleSuggestion
        ),

        weather_snapshot:
        createWeatherSnapshot(weather),
    };

    try {
        const { data, error } =
        await supabase
            .from(
            "recommendation_history"
            )
            .insert(payload)
            .select()
            .single();

        if (error) {
        throw error;
        }

        const nextHistory = [
        data,
        ...history,
        ];

        setHistory(nextHistory);

        writeLearningCache(
        user.id,
        nextHistory,
        feedback
        );

        return data;
    } catch (error) {
        console.error(
        "Could not save recommendation:",
        error
        );

        setLearningError(
        error.message ||
            "Could not save this recommendation."
        );

        return null;
    }
    };

const submitFeedback =
    async ({
    recommendationId,
    recommendation,
    rating,
    }) => {
    if (
        !user ||
        !recommendationId
    ) {
        return null;
    }

    setLearningError("");

    const closetItem =
        recommendation?.closetMatch
        ?.item || null;

    const payload = {
        user_id: user.id,

        recommendation_id:
        recommendationId,

        closet_item_id:
        closetItem?.id || null,

        rating,

        jacket_color:
        closetItem?.color || null,

        style_tags:
        closetItem?.style_tags || [],

        outfit_json:
        createOutfitSnapshot(
            recommendation?.styleSuggestion
        ),

        updated_at:
        new Date().toISOString(),
    };

    try {
        const { data, error } =
        await supabase
            .from("style_feedback")
            .upsert(payload, {
            onConflict:
                "user_id,recommendation_id",
            })
            .select()
            .single();

        if (error) {
        throw error;
        }

        const exists = feedback.some(
        (entry) =>
            entry.recommendation_id ===
            recommendationId
        );

        const nextFeedback = exists
        ? feedback.map((entry) =>
            entry.recommendation_id ===
            recommendationId
                ? data
                : entry
            )
        : [data, ...feedback];

        setFeedback(nextFeedback);

        writeLearningCache(
        user.id,
        history,
        nextFeedback
        );

        return data;
    } catch (error) {
        console.error(
        "Could not save style feedback:",
        error
        );

        setLearningError(
        error.message ||
            "Could not save your feedback."
        );

        return null;
    }
    };

const deleteHistoryItem =
    async (historyId) => {
    if (!user || !historyId) {
        return false;
    }

    setLearningError("");

    try {
        const { error } = await supabase
        .from(
            "recommendation_history"
        )
        .delete()
        .eq("id", historyId)
        .eq("user_id", user.id);

        if (error) {
        throw error;
        }

        const nextHistory =
        history.filter(
            (entry) =>
            entry.id !== historyId
        );

        const nextFeedback =
        feedback.filter(
            (entry) =>
            entry.recommendation_id !==
            historyId
        );

        setHistory(nextHistory);
        setFeedback(nextFeedback);

        writeLearningCache(
        user.id,
        nextHistory,
        nextFeedback
        );

        return true;
    } catch (error) {
        console.error(
        "Could not delete history item:",
        error
        );

        setLearningError(
        error.message ||
            "Could not delete this history entry."
        );

        return false;
    }
    };

const getFeedbackForRecommendation =
    (recommendationId) => {
    return (
        feedback.find(
        (entry) =>
            entry.recommendation_id ===
            recommendationId
        ) || null
    );
    };

useEffect(() => {
    if (!user) {
    setHistory([]);
    setFeedback([]);
    return;
    }

    const cached =
    readLearningCache(user.id);

    setHistory(cached.history);
    setFeedback(cached.feedback);

    fetchLearningData({
    silent:
        cached.history.length > 0 ||
        cached.feedback.length > 0,
    });
}, [user, fetchLearningData]);

return {
    history,
    feedback,
    preferenceModel,
    learningLoading,
    learningRefreshing,
    learningError,
    fetchLearningData,
    saveRecommendation,
    submitFeedback,
    deleteHistoryItem,
    getFeedbackForRecommendation,
};
}

export default useRecommendationLearning;