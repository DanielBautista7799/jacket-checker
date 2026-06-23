import { TREND_CONFIG, normalizeTrendInfluence } from "../config/trendConfig.js";

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getSeason(date = new Date()) {
  const month = date.getUTCMonth() + 1;

  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "fall";
}

export function getTrendClimateTags({
  temperatureBand,
  weatherState,
  rainChance = 0,
  windSpeed = 0,
}) {
  const tags = new Set();

  if (temperatureBand) tags.add(String(temperatureBand).toLowerCase());
  if (weatherState) tags.add(String(weatherState).toLowerCase());
  if (rainChance >= 50) tags.add("rain");
  if (windSpeed >= 18) tags.add("wind");
  if (rainChance >= 50 && windSpeed >= 18) tags.add("rain_wind");
  if (rainChance < 30) tags.add("dry");
  if (["mild", "warm"].includes(temperatureBand)) tags.add("transitional");

  return [...tags];
}

function explainRuleStatus(rule, now) {
  if (!rule?.is_active) {
    return "inactive";
  }

  const startsAt = toDate(rule.starts_at);
  const expiresAt = toDate(rule.expires_at);

  if (startsAt && startsAt > now) {
    return "upcoming";
  }

  if (expiresAt && expiresAt < now) {
    return "expired";
  }

  return "active";
}

export function getActiveTrendRules({
  rules = [],
  profile = null,
  date = new Date(),
  style = null,
  temperatureBand = null,
  weatherState = null,
  rainChance = 0,
  windSpeed = 0,
}) {
  const useTrends = profile?.use_style_trends !== false;
  const influence = useTrends
    ? normalizeTrendInfluence(profile?.trend_influence)
    : "off";

  if (!useTrends || influence === "off") {
    return {
      enabled: false,
      influence: "off",
      season: getSeason(date),
      climateTags: getTrendClimateTags({
        temperatureBand,
        weatherState,
        rainChance,
        windSpeed,
      }),
      activeRules: [],
      ignoredRules: rules.map((rule) => ({
        id: rule.id || null,
        slug: rule.slug || null,
        reason: "disabled_by_profile",
      })),
    };
  }

  const season = getSeason(date);
  const climateTags = getTrendClimateTags({
    temperatureBand,
    weatherState,
    rainChance,
    windSpeed,
  });
  const normalizedStyle = String(style || profile?.style_preference || "streetwear").toLowerCase();
  const activeRules = [];
  const ignoredRules = [];

  for (const rule of Array.isArray(rules) ? rules : []) {
    const status = explainRuleStatus(rule, date);

    if (status !== "active") {
      ignoredRules.push({
        id: rule.id || null,
        slug: rule.slug || null,
        reason: status,
      });
      continue;
    }

    const styles = toArray(rule.style_tags);
    if (styles.length > 0 && !styles.includes(normalizedStyle)) {
      ignoredRules.push({
        id: rule.id || null,
        slug: rule.slug || null,
        reason: "style_conflict",
      });
      continue;
    }

    const seasons = toArray(rule.seasons || rule.season);
    const ruleClimateTags = toArray(rule.climate_tags);
    const hasForecastSpecificClimateMatch = ruleClimateTags.some((tag) =>
      climateTags.includes(tag)
    );

    if (
      seasons.length > 0 &&
      !seasons.includes(season) &&
      !seasons.includes("transitional") &&
      !hasForecastSpecificClimateMatch
    ) {
      ignoredRules.push({
        id: rule.id || null,
        slug: rule.slug || null,
        reason: "season_mismatch",
      });
      continue;
    }

    activeRules.push(rule);
  }

  return {
    enabled: true,
    influence,
    season,
    climateTags,
    activeRules,
    ignoredRules,
    totalRuleCount: Array.isArray(rules) ? rules.length : 0,
    activeRuleCount: activeRules.length,
    maximumSelectedRules: TREND_CONFIG.maximumSelectedRules,
  };
}
