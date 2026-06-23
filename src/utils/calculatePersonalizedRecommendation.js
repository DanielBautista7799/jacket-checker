import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";
import { buildRecommendationDiagnostics } from "./buildRecommendationDiagnostics.js";
import { calculateJacketScore } from "./calculateJacketScore.js";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation.js";
import { calculateProfileModifier } from "./calculateProfileModifier.js";
import { generateStyleSuggestion } from "./generateStyleSuggestion.js";
import { rankClosetItems } from "./rankClosetItems.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getSelectedConditions(weather, forecastAnalysis) {
  const selected = forecastAnalysis?.selectedConditions || {};

  return {
    feelsLike: toFiniteNumber(
      selected.feelsLike,
      toFiniteNumber(weather?.feelsLike, 65)
    ),
    rainChance: toFiniteNumber(
      selected.rainChance,
      toFiniteNumber(
        forecastAnalysis?.highestWindowRainChance,
        toFiniteNumber(weather?.rainChance, 0)
      )
    ),
    windSpeed: toFiniteNumber(
      selected.windSpeed,
      toFiniteNumber(
        forecastAnalysis?.highestWindowWind,
        toFiniteNumber(weather?.windSpeed, 0)
      )
    ),
    condition: String(
      selected.condition || weather?.condition || ""
    ).toLowerCase(),
  };
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

export function getProtectionOverride({
  mappedRecommendation,
  weather,
  forecastAnalysis,
}) {
  const config = RECOMMENDATION_CONFIG.protectionOverride;
  const originalDecision =
    mappedRecommendation?.decision || null;

  if (originalDecision === "YES") {
    return {
      recommendation: mappedRecommendation,
      reason: null,
      applied: false,
      rainRequired: false,
      windRequired: false,
      winterPrecipitation: false,
      originalDecision,
    };
  }

  const selectedConditions = getSelectedConditions(
    weather,
    forecastAnalysis
  );

  const precipitationCondition = includesAny(
    selectedConditions.condition,
    config.precipitationTerms
  );

  const winterPrecipitation = includesAny(
    selectedConditions.condition,
    config.winterPrecipitationTerms
  );

  const rainRequired =
    selectedConditions.rainChance >= config.rainChance ||
    (precipitationCondition &&
      selectedConditions.rainChance >=
        config.precipitationConditionRainChance) ||
    winterPrecipitation;

  const windRequired =
    selectedConditions.windSpeed >= config.windSpeed;

  if (!rainRequired && !windRequired) {
    return {
      recommendation: mappedRecommendation,
      reason: null,
      applied: false,
      rainRequired,
      windRequired,
      winterPrecipitation,
      originalDecision,
    };
  }

  const warmWindow =
    selectedConditions.feelsLike >=
    config.warmWindowFeelsLike;

  if (rainRequired && windRequired) {
    const primaryItem = warmWindow
      ? "Light weather shell"
      : "Water-resistant windbreaker";

    const reason = `Rain risk may reach ${Math.round(
      selectedConditions.rainChance
    )}% and wind may reach ${Math.round(
      selectedConditions.windSpeed
    )} mph, so protective outerwear is recommended even without a warmth need.`;

    return {
      recommendation: {
        ...mappedRecommendation,
        decision: "YES",
        jacketType: primaryItem,
        primaryItem,
        summary: warmWindow
          ? "Wear or bring a light weather shell. You do not need extra warmth, but the selected window has both high rain risk and strong wind."
          : "Wear a water-resistant windbreaker for the wet and windy selected window.",
        optionalLayer: null,
        recommendationBasis: "rain_wind_protection",
      },
      reason,
      applied: true,
      rainRequired,
      windRequired,
      winterPrecipitation,
      originalDecision,
    };
  }

  if (rainRequired) {
    const primaryItem = winterPrecipitation
      ? "Weather-protective jacket"
      : warmWindow
        ? "Light rain shell"
        : "Water-resistant jacket";

    const reason = `Rain risk may reach ${Math.round(
      selectedConditions.rainChance
    )}%, so a rain-protective jacket is recommended even if the selected window is warm.`;

    return {
      recommendation: {
        ...mappedRecommendation,
        decision: "YES",
        jacketType: primaryItem,
        primaryItem,
        summary: winterPrecipitation
          ? "Wear a weather-protective jacket because wintry precipitation is part of the selected forecast."
          : warmWindow
            ? "Wear or bring a light rain shell. It is recommended for rain protection, not extra warmth."
            : "Wear a water-resistant jacket because rain is likely during the selected window.",
        optionalLayer: null,
        recommendationBasis: "rain_protection",
      },
      reason,
      applied: true,
      rainRequired,
      windRequired,
      winterPrecipitation,
      originalDecision,
    };
  }

  const primaryItem = warmWindow
    ? "Light windbreaker"
    : "Wind-resistant jacket";

  const reason = `Wind may reach ${Math.round(
    selectedConditions.windSpeed
  )} mph, so wind-resistant outerwear is recommended even without a warmth need.`;

  return {
    recommendation: {
      ...mappedRecommendation,
      decision: "YES",
      jacketType: primaryItem,
      primaryItem,
      summary: warmWindow
        ? "Wear or bring a light windbreaker. It is recommended for wind protection, not extra warmth."
        : "Wear a wind-resistant jacket because strong wind is expected during the selected window.",
      optionalLayer: null,
      recommendationBasis: "wind_protection",
    },
    reason,
    applied: true,
    rainRequired,
    windRequired,
    winterPrecipitation,
    originalDecision,
  };
}

function getOwnedMatchSummary(recommendationBase, jacket) {
  const basis = recommendationBase?.recommendationBasis;
  const feelsLike = toFiniteNumber(
    recommendationBase?.selectedConditions?.feelsLike,
    65
  );
  const warmWindow = feelsLike >= 65;

  if (basis === "rain_wind_protection") {
    return warmWindow
      ? `${jacket.name} is your best owned option for the high rain risk and strong wind. Keep the layers underneath light because the selected window is warm.`
      : `${jacket.name} is your best owned option for the wet and windy selected window.`;
  }

  if (basis === "rain_protection") {
    return warmWindow
      ? `${jacket.name} is your best owned option for rain protection. It is being recommended for the weather, not extra warmth.`
      : `${jacket.name} is your best owned option for the likely rain and cooler conditions.`;
  }

  if (basis === "wind_protection") {
    return warmWindow
      ? `${jacket.name} is your best owned option for wind protection. It is being recommended for the weather, not extra warmth.`
      : `${jacket.name} is your best owned option for the strong wind and cooler conditions.`;
  }

  return "This owned jacket matches the selected forecast and your saved preferences.";
}

function attachStyleSuggestion({
  recommendation,
  weather,
  profile,
  closetItem = null,
  preferenceModel = null,
}) {
  const styleSuggestion = generateStyleSuggestion({
    recommendation,
    weather,
    profile,
    closetItem,
    forecastAnalysis: recommendation.forecastAnalysis,
    preferenceModel,
  });

  return {
    ...recommendation,
    styleSuggestion,
  };
}

export function buildRecommendationForClosetMatch({
  recommendationBase,
  closetMatch,
  weather,
  profile,
  rankedClosetMatches = [],
  weatherNeeds = null,
  preferenceModel = null,
}) {
  if (
    recommendationBase?.decision !== "YES" ||
    !closetMatch?.item
  ) {
    return attachStyleSuggestion({
      recommendation: {
        ...recommendationBase,
        closetMatch: null,
        rankedClosetMatches:
          recommendationBase?.decision === "YES"
            ? rankedClosetMatches
            : [],
        allRankedClosetMatches:
          recommendationBase?.decision === "YES"
            ? recommendationBase?.allRankedClosetMatches || []
            : [],
        weatherNeeds,
      },
      weather,
      profile,
      closetItem: null,
      preferenceModel,
    });
  }

  const jacket = closetMatch.item;
  const itemSubtype =
    jacket.subtype ||
    jacket.type ||
    recommendationBase.jacketType ||
    "jacket";

  const recommendation = {
    ...recommendationBase,
    primaryItem: jacket.name,
    jacketType: itemSubtype,
    summary: getOwnedMatchSummary(recommendationBase, jacket),
    closetMatch,
    rankedClosetMatches,
    weatherNeeds,
  };

  return attachStyleSuggestion({
    recommendation,
    weather,
    profile,
    closetItem: jacket,
    preferenceModel,
  });
}

function attachDiagnostics({
  recommendation,
  weather,
  profile,
  windowId,
  location,
  closetItems,
  ranking,
}) {
  const diagnostics = buildRecommendationDiagnostics({
    recommendation,
    weather,
    profile,
    windowId,
    location,
    closetItems,
    ranking,
  });

  return {
    ...recommendation,
    confidence: diagnostics.decision.confidence,
    diagnostics,
  };
}

export function calculatePersonalizedRecommendation({
  weather,
  profile,
  windowId = "rest_of_day",
  closetItems = [],
  preferenceModel = null,
  excludedItemIds = [],
  location = null,
}) {
  const baseResult = calculateJacketScore({
    weather,
    windowId,
  });

  const profileResult = calculateProfileModifier(
    profile,
    weather,
    baseResult.forecastAnalysis
  );

  const personalizedScore =
    baseResult.score + profileResult.modifier;

  const mappedRecommendation = mapScoreToRecommendation(
    personalizedScore,
    weather,
    baseResult.forecastAnalysis
  );

  const protectionResult = getProtectionOverride({
    mappedRecommendation,
    weather,
    forecastAnalysis: baseResult.forecastAnalysis,
  });

  const effectiveRecommendation =
    protectionResult.recommendation;

  const jacketRanking = rankClosetItems({
    closetItems,
    weather,
    forecastAnalysis: baseResult.forecastAnalysis,
    profile,
    preferenceModel,
    excludedItemIds,
  });

  const recommendationBase = {
    ...effectiveRecommendation,
    score: personalizedScore,
    baseScore: baseResult.score,
    profileModifier: profileResult.modifier,
    reasons: [
      ...baseResult.reasons,
      ...profileResult.profileReasons,
      ...(protectionResult.reason
        ? [protectionResult.reason]
        : []),
    ],
    forecastAnalysis: baseResult.forecastAnalysis,
    selectedConditions: baseResult.selectedConditions,
    confidence: baseResult.confidence,
    profileReasons: profileResult.profileReasons,
    weatherScoreBreakdown: baseResult.scoreBreakdown,
    profileModifierBreakdown:
      profileResult.modifierBreakdown,
    protectionOverride: {
      applied: protectionResult.applied,
      rainRequired: protectionResult.rainRequired,
      windRequired: protectionResult.windRequired,
      winterPrecipitation:
        protectionResult.winterPrecipitation,
      originalDecision: protectionResult.originalDecision,
      reason: protectionResult.reason,
    },
  };

  if (effectiveRecommendation.decision !== "YES") {
    const recommendation = attachStyleSuggestion({
      recommendation: {
        ...recommendationBase,
        closetMatch: null,
        rankedClosetMatches: [],
        allRankedClosetMatches: [],
        weatherNeeds: null,
      },
      weather,
      profile,
      closetItem: null,
      preferenceModel,
    });

    return attachDiagnostics({
      recommendation,
      weather,
      profile,
      windowId,
      location,
      closetItems,
      ranking: jacketRanking,
    });
  }

  const recommendation = buildRecommendationForClosetMatch({
    recommendationBase: {
      ...recommendationBase,
      weatherNeeds: jacketRanking.weatherNeeds,
      rankedClosetMatches: jacketRanking.topMatches,
      allRankedClosetMatches: jacketRanking.rankedItems,
    },
    closetMatch: jacketRanking.bestMatch,
    weather,
    profile,
    rankedClosetMatches: jacketRanking.topMatches,
    weatherNeeds: jacketRanking.weatherNeeds,
    preferenceModel,
  });

  return attachDiagnostics({
    recommendation,
    weather,
    profile,
    windowId,
    location,
    closetItems,
    ranking: jacketRanking,
  });
}
