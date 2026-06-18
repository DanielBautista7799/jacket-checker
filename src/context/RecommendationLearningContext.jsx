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
import { buildPreferenceModel } from "../utils/buildPreferenceModel";

export const RecommendationLearningContext =
  createContext(null);

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 3 * 60 * 1000;
const inFlightLearningRequests = new Map();

function getCacheKey(userId) {
  return `jacket-check:learning:v${CACHE_VERSION}:${userId}`;
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
        ? parsed.history
        : [],
      feedback: Array.isArray(parsed.feedback)
        ? parsed.feedback
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

function createWeatherSnapshot(weather) {
  if (!weather) {
    return {};
  }

  return {
    city: weather.city || null,
    feelsLike: weather.feelsLike ?? null,
    temperature: weather.temperature ?? null,
    windSpeed: weather.windSpeed ?? null,
    rainChance: weather.rainChance ?? null,
    condition: weather.condition || null,
  };
}

function createOutfitSnapshot(styleSuggestion) {
  if (!styleSuggestion) {
    return null;
  }

  return {
    outfitTitle: styleSuggestion.outfitTitle || null,
    jacketStyle: styleSuggestion.jacketStyle || null,
    pieces: styleSuggestion.pieces || [],
    top: styleSuggestion.top || null,
    bottoms: styleSuggestion.bottoms || null,
    shoes: styleSuggestion.shoes || null,
    accessory: styleSuggestion.accessory || null,
    colorNote: styleSuggestion.colorNote || null,
    reason: styleSuggestion.reason || null,
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
        history: historyResponse.data || [],
        feedback: feedbackResponse.data || [],
      };
    })
    .finally(() => {
      inFlightLearningRequests.delete(userId);
    });

  inFlightLearningRequests.set(userId, request);

  return request;
}

export function RecommendationLearningProvider({
  children,
}) {
  const { user, authLoading } = useAuth();

  const initialCache = readCache(user?.id);

  const [history, setHistory] = useState(
    initialCache?.history || []
  );

  const [feedback, setFeedback] = useState(
    initialCache?.feedback || []
  );

  const [learningLoading, setLearningLoading] =
    useState(Boolean(user) && !initialCache);

  const [learningRefreshing, setLearningRefreshing] =
    useState(false);

  const [learningError, setLearningError] = useState("");

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
    () => buildPreferenceModel(feedback),
    [feedback]
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
    async ({
      recommendation,
      weather,
      timeWindow,
    }) => {
      if (!user?.id || !recommendation) {
        return null;
      }

      setLearningError("");

      const closetItem =
        recommendation.closetMatch?.item || null;

      const payload = {
        user_id: user.id,
        closet_item_id: closetItem?.id || null,
        decision: recommendation.decision,
        jacket_name:
          recommendation.primaryItem || "No jacket",
        jacket_color: closetItem?.color || null,
        summary: recommendation.summary || null,
        time_window: timeWindow,
        outfit_json: createOutfitSnapshot(
          recommendation.styleSuggestion
        ),
        weather_snapshot: createWeatherSnapshot(weather),
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

        commitLearning(
          [data, ...historyRef.current],
          feedbackRef.current
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
    },
    [user, commitLearning]
  );

  const submitFeedback = useCallback(
    async ({
      recommendationId,
      recommendation,
      rating,
    }) => {
      if (!user?.id || !recommendationId) {
        return null;
      }

      setLearningError("");

      const closetItem =
        recommendation?.closetMatch?.item || null;

      const payload = {
        user_id: user.id,
        recommendation_id: recommendationId,
        closet_item_id: closetItem?.id || null,
        rating,
        jacket_color: closetItem?.color || null,
        style_tags: closetItem?.style_tags || [],
        outfit_json: createOutfitSnapshot(
          recommendation?.styleSuggestion
        ),
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

        const currentFeedback = feedbackRef.current;
        const exists = currentFeedback.some(
          (entry) =>
            entry.recommendation_id === recommendationId
        );

        const nextFeedback = exists
          ? currentFeedback.map((entry) =>
              entry.recommendation_id === recommendationId
                ? data
                : entry
            )
          : [data, ...currentFeedback];

        commitLearning(historyRef.current, nextFeedback);

        return data;
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
          (entry) =>
            entry.recommendation_id !== historyId
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

  const getFeedbackForRecommendation = useCallback(
    (recommendationId) => {
      return (
        feedbackRef.current.find(
          (entry) =>
            entry.recommendation_id === recommendationId
        ) || null
      );
    },
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
      fetchLearningData,
      saveRecommendation,
      submitFeedback,
      deleteHistoryItem,
      getFeedbackForRecommendation,
    }),
    [
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
    ]
  );

  return (
    <RecommendationLearningContext.Provider value={value}>
      {children}
    </RecommendationLearningContext.Provider>
  );
}
