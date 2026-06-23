import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import useWardrobeItems from "../hooks/useWardrobeItems";
import { buildPreferenceModel } from "../utils/buildPreferenceModel";
import {
  createRecommendationLearningContext,
  getWeatherContextFromConditions,
} from "../utils/feedbackLearning";

export const RecommendationLearningContext = createContext(null);

const CACHE_VERSION = 5;
const CACHE_TTL_MS = 3 * 60 * 1000;

const inFlightLearningRequests = new Map();

function getCacheKey(userId) {
  return `jacket-check:learning:v${CACHE_VERSION}:${userId}`;
}

function normalizeHistoryEntry(entry) {
  const wardrobeItemId =
    entry?.wardrobe_item_id || entry?.closet_item_id || null;

  return {
    ...entry,
    wardrobe_item_id: wardrobeItemId,
    closet_item_id: wardrobeItemId,
  };
}

function normalizeFeedbackEntry(entry) {
  const wardrobeItemId =
    entry?.wardrobe_item_id || entry?.closet_item_id || null;

  return {
    ...entry,
    wardrobe_item_id: wardrobeItemId,
    closet_item_id: wardrobeItemId,
  };
}

function readCache(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(getCacheKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return {
      history: Array.isArray(parsed.history)
        ? parsed.history.map(normalizeHistoryEntry)
        : [],

      feedback: Array.isArray(parsed.feedback)
        ? parsed.feedback.map(normalizeFeedbackEntry)
        : [],

      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch (error) {
    console.error("Could not read learning cache:", error);
    return null;
  }
}

function writeCache(userId, history, feedback) {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({
        history,
        feedback,
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error("Could not write learning cache:", error);
  }
}

function getSelectedConditions(recommendation, weather) {
  const selected =
    recommendation?.selectedConditions ||
    recommendation?.forecastAnalysis?.selectedConditions ||
    {};

  return {
    feelsLike:
      selected.feelsLike ?? weather?.feelsLike ?? null,
    lowestFeelsLike:
      selected.lowestFeelsLike ??
      recommendation?.forecastAnalysis?.lowestWindowFeelsLike ??
      selected.feelsLike ??
      weather?.feelsLike ??
      null,
    rainChance:
      selected.rainChance ??
      recommendation?.forecastAnalysis?.highestWindowRainChance ??
      weather?.rainChance ??
      null,
    windSpeed:
      selected.windSpeed ??
      recommendation?.forecastAnalysis?.highestWindowWind ??
      weather?.windSpeed ??
      null,
    condition:
      selected.condition || weather?.condition || null,
  };
}

function createWeatherSnapshot({ weather, recommendation, timeWindow }) {
  if (!weather && !recommendation) {
    return {};
  }

  const selectedConditions = getSelectedConditions(
    recommendation,
    weather
  );

  return {
    city: weather?.city || null,
    feelsLike: weather?.feelsLike ?? null,
    temperature: weather?.temperature ?? null,
    windSpeed: weather?.windSpeed ?? null,
    rainChance: weather?.rainChance ?? null,
    condition: weather?.condition || null,
    selectedFeelsLike: selectedConditions.feelsLike,
    lowestFeelsLike: selectedConditions.lowestFeelsLike,
    selectedWindSpeed: selectedConditions.windSpeed,
    selectedRainChance: selectedConditions.rainChance,
    selectedCondition: selectedConditions.condition,
    forecastWindow:
      timeWindow ||
      recommendation?.forecastAnalysis?.windowId ||
      "rest_of_day",
    weatherContext: getWeatherContextFromConditions(
      selectedConditions
    ),
  };
}

function createOutfitSnapshot({
  styleSuggestion,
  recommendation,
  wardrobeItem,
  timeWindow,
}) {
  if (!styleSuggestion && !recommendation) {
    return null;
  }

  const title =
    styleSuggestion?.title ||
    styleSuggestion?.outfitTitle ||
    "Style idea";

  const learningContext = createRecommendationLearningContext({
    recommendation,
    wardrobeItem,
    timeWindow,
  });

  return {
    version: 5,
    type: "style_suggestion",
    title,
    outfitTitle: title,
    summary: styleSuggestion?.summary || null,
    style: styleSuggestion?.style || null,
    styleLabel: styleSuggestion?.styleLabel || null,
    jacketColor: styleSuggestion?.jacketColor || null,
    secondaryColor: styleSuggestion?.secondaryColor || null,
    temperatureBand: styleSuggestion?.temperatureBand || null,
    weatherState: styleSuggestion?.weatherState || null,
    colorStrategy: styleSuggestion?.colorStrategy || null,
    variantKey: styleSuggestion?.variantKey || null,
    weatherNote: styleSuggestion?.weatherNote || null,
    reason: styleSuggestion?.reason || null,
    learningContext,
    pieces: [],
  };
}

async function requestLearningData(userId) {
  if (inFlightLearningRequests.has(userId)) {
    return inFlightLearningRequests.get(userId);
  }

  const request = Promise.all([
    supabase
      .from("recommendation_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(100),

    supabase
      .from("style_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      }),
  ])
    .then(([historyResponse, feedbackResponse]) => {
      if (historyResponse.error) {
        throw historyResponse.error;
      }

      if (feedbackResponse.error) {
        throw feedbackResponse.error;
      }

      return {
        history: (historyResponse.data || []).map(
          normalizeHistoryEntry
        ),

        feedback: (feedbackResponse.data || []).map(
          normalizeFeedbackEntry
        ),
      };
    })
    .finally(() => {
      inFlightLearningRequests.delete(userId);
    });

  inFlightLearningRequests.set(userId, request);

  return request;
}

export function RecommendationLearningProvider({ children }) {
  const { user, authLoading } = useAuth();
  const { fetchWardrobeItems } = useWardrobeItems();

  const initialCache = readCache(user?.id);

  const [history, setHistory] = useState(
    initialCache?.history || []
  );

  const [feedback, setFeedback] = useState(
    initialCache?.feedback || []
  );

  const [learningLoading, setLearningLoading] = useState(
    Boolean(user) && !initialCache
  );

  const [learningRefreshing, setLearningRefreshing] =
    useState(false);

  const [learningError, setLearningError] = useState("");
  const [resettingLearning, setResettingLearning] =
    useState(false);

  const activeUserIdRef = useRef(user?.id || null);
  const historyRef = useRef(history);
  const feedbackRef = useRef(feedback);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  const preferenceModel = useMemo(
    () =>
      buildPreferenceModel({
        feedback,
        history,
      }),
    [feedback, history]
  );

  const commitLearning = useCallback(
    (nextHistory, nextFeedback) => {
      historyRef.current = nextHistory;
      feedbackRef.current = nextFeedback;

      setHistory(nextHistory);
      setFeedback(nextFeedback);

      if (activeUserIdRef.current) {
        writeCache(
          activeUserIdRef.current,
          nextHistory,
          nextFeedback
        );
      }
    },
    []
  );

  const fetchLearningData = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!user?.id) {
        commitLearning([], []);
        setLearningLoading(false);
        setLearningRefreshing(false);

        return {
          history: [],
          feedback: [],
        };
      }

      const cached = readCache(user.id);

      const cacheIsFresh =
        cached &&
        Date.now() - cached.savedAt < CACHE_TTL_MS;

      if (!force && cacheIsFresh) {
        commitLearning(cached.history, cached.feedback);
        setLearningLoading(false);

        return {
          history: cached.history,
          feedback: cached.feedback,
        };
      }

      if (silent || cached) {
        setLearningRefreshing(true);
      } else {
        setLearningLoading(true);
      }

      setLearningError("");

      try {
        const result = await requestLearningData(user.id);

        if (activeUserIdRef.current !== user.id) {
          return {
            history: [],
            feedback: [],
          };
        }

        commitLearning(result.history, result.feedback);

        return result;
      } catch (error) {
        console.error(
          "Could not load recommendation learning:",
          error
        );

        if (activeUserIdRef.current === user.id) {
          setLearningError(
            error.message ||
              "Could not load recommendation history."
          );
        }

        return {
          history: cached?.history || [],
          feedback: cached?.feedback || [],
        };
      } finally {
        if (activeUserIdRef.current === user.id) {
          setLearningLoading(false);
          setLearningRefreshing(false);
        }
      }
    },
    [user, commitLearning]
  );

  const saveRecommendation = useCallback(
    async ({ recommendation, weather, timeWindow }) => {
      if (!user?.id || !recommendation) {
        return null;
      }

      setLearningError("");

      const wardrobeItem =
        recommendation.closetMatch?.item || null;

      const payload = {
        user_id: user.id,

        wardrobe_item_id: wardrobeItem?.id || null,

        decision: recommendation.decision,

        jacket_name:
          recommendation.primaryItem || "No jacket",

        jacket_color:
          wardrobeItem?.primary_color ||
          wardrobeItem?.color ||
          null,

        summary: recommendation.summary || null,

        time_window: timeWindow,

        outfit_json: createOutfitSnapshot({
          styleSuggestion: recommendation.styleSuggestion,
          recommendation,
          wardrobeItem,
          timeWindow,
        }),

        weather_snapshot: createWeatherSnapshot({
          weather,
          recommendation,
          timeWindow,
        }),
      };

      try {
        const { data, error } = await supabase
          .from("recommendation_history")
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const normalizedEntry = normalizeHistoryEntry(data);

        commitLearning(
          [normalizedEntry, ...historyRef.current],
          feedbackRef.current
        );

        return normalizedEntry;
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
    },
    [user, commitLearning]
  );

  const submitFeedback = useCallback(
    async ({
      recommendationId,
      recommendation,
      rating,
      timeWindow = null,
    }) => {
      if (!user?.id || !recommendationId) {
        return null;
      }

      setLearningError("");

      const wardrobeItem =
        recommendation?.closetMatch?.item || null;

      const payload = {
        user_id: user.id,

        recommendation_id: recommendationId,

        wardrobe_item_id: wardrobeItem?.id || null,

        rating,

        jacket_color:
          wardrobeItem?.primary_color ||
          wardrobeItem?.color ||
          null,

        style_tags: wardrobeItem?.style_tags || [],

        outfit_json: createOutfitSnapshot({
          styleSuggestion: recommendation?.styleSuggestion,
          recommendation,
          wardrobeItem,
          timeWindow,
        }),

        updated_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from("style_feedback")
          .upsert(payload, {
            onConflict: "user_id,recommendation_id",
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const normalizedEntry = normalizeFeedbackEntry(data);

        const currentFeedback = feedbackRef.current;

        const exists = currentFeedback.some(
          (entry) =>
            entry.recommendation_id === recommendationId
        );

        const nextFeedback = exists
          ? currentFeedback.map((entry) =>
              entry.recommendation_id === recommendationId
                ? normalizedEntry
                : entry
            )
          : [normalizedEntry, ...currentFeedback];

        commitLearning(historyRef.current, nextFeedback);

        return normalizedEntry;
      } catch (error) {
        console.error(
          "Could not save style feedback:",
          error
        );

        setLearningError(
          error.message || "Could not save your feedback."
        );

        return null;
      }
    },
    [user, commitLearning]
  );

  const deleteHistoryItem = useCallback(
    async (historyId) => {
      if (!user?.id || !historyId) {
        return false;
      }

      setLearningError("");

      try {
        const { error } = await supabase
          .from("recommendation_history")
          .delete()
          .eq("id", historyId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        const nextHistory = historyRef.current.filter(
          (entry) => entry.id !== historyId
        );

        const nextFeedback = feedbackRef.current.filter(
          (entry) => entry.recommendation_id !== historyId
        );

        commitLearning(nextHistory, nextFeedback);

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
    },
    [user, commitLearning]
  );

  const resetRecommendationLearning = useCallback(async () => {
    if (!user?.id || resettingLearning) {
      return false;
    }

    setResettingLearning(true);
    setLearningError("");

    try {
      const [feedbackResponse, wardrobeResponse] =
        await Promise.all([
          supabase
            .from("style_feedback")
            .delete()
            .eq("user_id", user.id),

          supabase
            .from("wardrobe_items")
            .update({ preference_score: 0 })
            .eq("user_id", user.id)
            .eq("category", "jacket"),
        ]);

      if (feedbackResponse.error) {
        throw feedbackResponse.error;
      }

      if (wardrobeResponse.error) {
        throw wardrobeResponse.error;
      }

      commitLearning(historyRef.current, []);

      await fetchWardrobeItems({
        force: true,
        silent: true,
      });

      return true;
    } catch (error) {
      console.error(
        "Could not reset recommendation learning:",
        error
      );

      setLearningError(
        error.message ||
          "Could not reset recommendation learning."
      );

      await fetchLearningData({
        force: true,
        silent: true,
      });

      await fetchWardrobeItems({
        force: true,
        silent: true,
      });

      return false;
    } finally {
      setResettingLearning(false);
    }
  }, [
    user,
    resettingLearning,
    commitLearning,
    fetchLearningData,
    fetchWardrobeItems,
  ]);

  const getFeedbackForRecommendation = useCallback(
    (recommendationId) =>
      feedbackRef.current.find(
        (entry) =>
          entry.recommendation_id === recommendationId
      ) || null,
    []
  );

  useEffect(() => {
    activeUserIdRef.current = user?.id || null;

    if (authLoading) {
      return;
    }

    if (!user?.id) {
      commitLearning([], []);
      setLearningLoading(false);
      setLearningRefreshing(false);
      setLearningError("");
      setResettingLearning(false);
      return;
    }

    const cached = readCache(user.id);

    if (cached) {
      commitLearning(cached.history, cached.feedback);
      setLearningLoading(false);

      fetchLearningData({
        silent: true,
      });
    } else {
      commitLearning([], []);
      fetchLearningData();
    }
  }, [
    authLoading,
    user?.id,
    fetchLearningData,
    commitLearning,
  ]);

  const value = useMemo(
    () => ({
      history,
      feedback,
      preferenceModel,
      learningLoading,
      learningRefreshing,
      learningError,
      resettingLearning,
      fetchLearningData,
      saveRecommendation,
      submitFeedback,
      deleteHistoryItem,
      resetRecommendationLearning,
      getFeedbackForRecommendation,
    }),
    [
      history,
      feedback,
      preferenceModel,
      learningLoading,
      learningRefreshing,
      learningError,
      resettingLearning,
      fetchLearningData,
      saveRecommendation,
      submitFeedback,
      deleteHistoryItem,
      resetRecommendationLearning,
      getFeedbackForRecommendation,
    ]
  );

  return (
    <RecommendationLearningContext.Provider value={value}>
      {children}
    </RecommendationLearningContext.Provider>
  );
}
