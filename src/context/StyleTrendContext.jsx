import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TREND_CONFIG } from "../config/trendConfig.js";
import { DEFAULT_TREND_RULES } from "../data/defaultTrendRules.js";
import useAuth from "../hooks/useAuth.js";
import { supabase } from "../lib/supabaseClient.js";

export const StyleTrendContext = createContext(null);

const RULE_CACHE_KEY = "jacket-check:style-trends:v1";
const feedbackRequestMap = new Map();
let activeRuleRequest = null;

function readRuleCache() {
  try {
    const raw = localStorage.getItem(RULE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.rules)) return null;

    return {
      rules: parsed.rules,
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

function writeRuleCache(rules) {
  try {
    localStorage.setItem(
      RULE_CACHE_KEY,
      JSON.stringify({ rules, savedAt: Date.now() })
    );
  } catch {
    // Caching is optional.
  }
}

function feedbackCacheKey(userId) {
  return `jacket-check:trend-feedback:v1:${userId}`;
}

function readFeedbackCache(userId) {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(feedbackCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

function writeFeedbackCache(userId, feedback) {
  if (!userId) return;

  try {
    localStorage.setItem(
      feedbackCacheKey(userId),
      JSON.stringify({ feedback, savedAt: Date.now() })
    );
  } catch {
    // Caching is optional.
  }
}

async function requestActiveRules() {
  if (activeRuleRequest) return activeRuleRequest;

  activeRuleRequest = supabase
    .from("style_trend_rules")
    .select("*")
    .order("weight", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    })
    .finally(() => {
      activeRuleRequest = null;
    });

  return activeRuleRequest;
}

async function requestFeedback(userId) {
  if (feedbackRequestMap.has(userId)) {
    return feedbackRequestMap.get(userId);
  }

  const request = supabase
    .from("style_trend_feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(250)
    .then(({ data, error }) => {
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    })
    .finally(() => {
      feedbackRequestMap.delete(userId);
    });

  feedbackRequestMap.set(userId, request);
  return request;
}

function buildTrendPreferenceModel(feedback) {
  const model = {
    byRule: {},
    bySlug: {},
    byStyle: {},
    responseCounts: {
      classic: 0,
      feels_right: 0,
      more_current: 0,
    },
  };

  for (const entry of feedback) {
    const weight = TREND_CONFIG.feedbackWeights[entry.response] || 0;
    model.responseCounts[entry.response] =
      (model.responseCounts[entry.response] || 0) + 1;

    for (const id of entry.trend_rule_ids || []) {
      model.byRule[id] = (model.byRule[id] || 0) + weight;
    }

    for (const slug of entry.trend_rule_slugs || []) {
      model.bySlug[slug] = (model.bySlug[slug] || 0) + weight;
    }

    const style = entry.style_preference;
    if (style) {
      model.byStyle[style] = (model.byStyle[style] || 0) + weight;
    }
  }

  return model;
}

export function StyleTrendProvider({ children }) {
  const { user, authLoading } = useAuth();
  const initialRules = readRuleCache();
  const initialFeedback = readFeedbackCache(user?.id);

  const [rules, setRules] = useState(
    initialRules?.rules || DEFAULT_TREND_RULES
  );
  const [trendSource, setTrendSource] = useState(
    initialRules?.rules?.length ? "database_cache" : "fallback"
  );
  const [trendLoading, setTrendLoading] = useState(!initialRules);
  const [trendRefreshing, setTrendRefreshing] = useState(false);
  const [trendError, setTrendError] = useState("");
  const [feedback, setFeedback] = useState(
    initialFeedback?.feedback || []
  );
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const activeUserRef = useRef(user?.id || null);

  const fetchTrendRules = useCallback(
    async ({ force = false, silent = false } = {}) => {
      const cached = readRuleCache();
      const cacheFresh =
        cached && Date.now() - cached.savedAt < TREND_CONFIG.cacheTtlMs;

      if (!force && cacheFresh) {
        setRules(cached.rules);
        setTrendSource("database_cache");
        setTrendLoading(false);
        return cached.rules;
      }

      if (silent || cached) setTrendRefreshing(true);
      else setTrendLoading(true);

      setTrendError("");

      try {
        const data = await requestActiveRules();
        const nextRules = data.length > 0 ? data : DEFAULT_TREND_RULES;
        setRules(nextRules);
        setTrendSource(data.length > 0 ? "database" : "fallback");
        if (data.length > 0) writeRuleCache(data);
        return nextRules;
      } catch (error) {
        console.error("Could not load style trend rules:", error);
        const fallback = cached?.rules || DEFAULT_TREND_RULES;
        setRules(fallback);
        setTrendSource(cached?.rules ? "database_cache" : "fallback");
        setTrendError(
          "Current trend rules are unavailable, so the local style library is being used."
        );
        return fallback;
      } finally {
        setTrendLoading(false);
        setTrendRefreshing(false);
      }
    },
    []
  );

  const fetchTrendFeedback = useCallback(
    async ({ force = false } = {}) => {
      if (!user?.id) {
        setFeedback([]);
        return [];
      }

      const cached = readFeedbackCache(user.id);
      const cacheFresh =
        cached && Date.now() - cached.savedAt < TREND_CONFIG.cacheTtlMs;

      if (!force && cacheFresh) {
        setFeedback(cached.feedback);
        return cached.feedback;
      }

      try {
        const data = await requestFeedback(user.id);
        if (activeUserRef.current !== user.id) return [];
        setFeedback(data);
        writeFeedbackCache(user.id, data);
        return data;
      } catch (error) {
        console.error("Could not load trend feedback:", error);
        return cached?.feedback || [];
      }
    },
    [user]
  );

  const submitTrendFeedback = useCallback(
    async ({ response, styleSuggestion, recommendationId = null }) => {
      if (!user?.id || !TREND_CONFIG.allowedFeedback.includes(response)) {
        return null;
      }

      const trend = styleSuggestion?.trend;
      if (!trend?.adjustmentApplied) return null;

      setFeedbackSaving(true);
      setTrendError("");

      const ruleIds = [
        trend.primaryRule?.id,
        trend.supportingRule?.id,
      ].filter(Boolean);
      const ruleSlugs = [
        trend.primaryRule?.slug,
        trend.supportingRule?.slug,
      ].filter(Boolean);

      const payload = {
        user_id: user.id,
        recommendation_history_id: recommendationId,
        response,
        style_preference: styleSuggestion.style || null,
        trend_influence: trend.influence || "subtle",
        trend_rule_ids: ruleIds,
        trend_rule_slugs: ruleSlugs,
        style_suggestion_snapshot: {
          title: styleSuggestion.title || null,
          summary: styleSuggestion.summary || null,
          trend_note: styleSuggestion.trendNote || null,
          weather_state: styleSuggestion.weatherState || null,
          temperature_band: styleSuggestion.temperatureBand || null,
        },
      };

      try {
        const { data, error } = await supabase
          .from("style_trend_feedback")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        const nextFeedback = [data, ...feedback];
        setFeedback(nextFeedback);
        writeFeedbackCache(user.id, nextFeedback);
        return data;
      } catch (error) {
        console.error("Could not save trend feedback:", error);
        setTrendError(error.message || "Could not save trend feedback.");
        return null;
      } finally {
        setFeedbackSaving(false);
      }
    },
    [user, feedback]
  );

  const adminAction = useCallback(async (action, payload = {}) => {
    const { data, error } = await supabase.functions.invoke(
      "sync-style-trends",
      { body: { action, payload } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error.message || data.error);

    if (["create", "update", "enable", "disable", "import"].includes(action)) {
      await fetchTrendRules({ force: true });
    }

    return data;
  }, [fetchTrendRules]);

  useEffect(() => {
    activeUserRef.current = user?.id || null;

    const cached = readRuleCache();
    if (cached) {
      setRules(cached.rules);
      setTrendSource("database_cache");
      setTrendLoading(false);
      fetchTrendRules({ silent: true });
    } else {
      fetchTrendRules();
    }

    if (authLoading) return;
    fetchTrendFeedback();
  }, [authLoading, user?.id, fetchTrendRules, fetchTrendFeedback]);

  const trendPreferenceModel = useMemo(
    () => buildTrendPreferenceModel(feedback),
    [feedback]
  );

  const value = useMemo(
    () => ({
      rules,
      trendSource,
      trendLoading,
      trendRefreshing,
      trendError,
      feedback,
      feedbackSaving,
      trendPreferenceModel,
      fetchTrendRules,
      fetchTrendFeedback,
      submitTrendFeedback,
      adminAction,
    }),
    [
      rules,
      trendSource,
      trendLoading,
      trendRefreshing,
      trendError,
      feedback,
      feedbackSaving,
      trendPreferenceModel,
      fetchTrendRules,
      fetchTrendFeedback,
      submitTrendFeedback,
      adminAction,
    ]
  );

  return (
    <StyleTrendContext.Provider value={value}>
      {children}
    </StyleTrendContext.Provider>
  );
}
