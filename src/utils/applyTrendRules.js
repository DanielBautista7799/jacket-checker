import { normalizeTrendInfluence } from "../config/trendConfig.js";
import { getActiveTrendRules } from "./getActiveTrendRules.js";
import { matchStyleTrendRules } from "./matchStyleTrendRules.js";

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectPhrase(rule, influence, seed) {
  if (!rule) return null;

  const phrases = rule.suggestion_phrases || {};
  const options =
    influence === "balanced"
      ? phrases.balanced || phrases.subtle || []
      : phrases.subtle || phrases.balanced || [];

  const normalized = Array.isArray(options)
    ? options.filter(Boolean)
    : options
      ? [options]
      : [];

  if (normalized.length === 0) return null;
  return normalized[seed % normalized.length];
}

export function applyTrendRules({
  styleSuggestion,
  rules = [],
  profile,
  style,
  jacket,
  temperatureBand,
  weatherState,
  rainChance,
  windSpeed,
  trendPreferenceModel = null,
  source = "database",
  date = new Date(),
  seedText = "trend",
}) {
  const influence = profile?.use_style_trends === false
    ? "off"
    : normalizeTrendInfluence(profile?.trend_influence);

  const activeResult = getActiveTrendRules({
    rules,
    profile: {
      ...profile,
      trend_influence: influence,
    },
    date,
    style,
    temperatureBand,
    weatherState,
    rainChance,
    windSpeed,
  });

  const matched = matchStyleTrendRules({
    activeResult,
    style,
    jacket,
    trendPreferenceModel,
  });

  const seed = hashString(`${seedText}|${matched.primary?.rule?.slug || "none"}`);
  const primaryPhrase = selectPhrase(matched.primary?.rule, influence, seed);
  const supportingPhrase = selectPhrase(
    matched.supporting?.rule,
    influence,
    seed + 11
  );

  const trendNote = [primaryPhrase, supportingPhrase]
    .filter(Boolean)
    .join(" ") || null;

  return {
    ...styleSuggestion,
    trendNote,
    trend: {
      enabled: activeResult.enabled,
      influence,
      source,
      season: activeResult.season,
      climateTags: activeResult.climateTags,
      totalRuleCount: activeResult.totalRuleCount || rules.length,
      activeRuleCount: activeResult.activeRuleCount || activeResult.activeRules.length,
      matchedRuleCount: matched.matches.length,
      primaryRule: matched.primary
        ? {
            id: matched.primary.rule.id || null,
            slug: matched.primary.rule.slug,
            name: matched.primary.rule.name,
            reasons: matched.primary.reasons,
          }
        : null,
      supportingRule: matched.supporting
        ? {
            id: matched.supporting.rule.id || null,
            slug: matched.supporting.rule.slug,
            name: matched.supporting.rule.name,
            reasons: matched.supporting.reasons,
          }
        : null,
      ignoredRules: activeResult.ignoredRules,
      adjustmentApplied: Boolean(trendNote),
    },
  };
}
