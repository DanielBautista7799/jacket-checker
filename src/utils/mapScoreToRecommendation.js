import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";

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
    lowestFeelsLike: toFiniteNumber(
      selected.lowestFeelsLike,
      toFiniteNumber(
        forecastAnalysis?.lowestWindowFeelsLike,
        toFiniteNumber(weather?.feelsLike, 65)
      )
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
    sustainedRainRisk: selected.sustainedRainRisk === true,
  };
}

function findSuggestion(forecastAnalysis, allowedItems) {
  const suggestions =
    forecastAnalysis?.bringAlongSuggestions || [];

  const allowed = new Set(
    allowedItems.map((item) => item.toLowerCase())
  );

  return (
    suggestions.find((suggestion) =>
      allowed.has(String(suggestion.item).toLowerCase())
    ) || null
  );
}

function buildOptionalLayer({
  rainy,
  windy,
  selectedConditions,
  forecastAnalysis,
}) {
  if (rainy) {
    return (
      findSuggestion(forecastAnalysis, [
        "Light rain shell",
        "Packable rain layer",
      ]) || {
        item: "Packable rain layer",
        reason:
          "Warmth may not be necessary, but rain protection could still be useful.",
      }
    );
  }

  if (windy) {
    return (
      findSuggestion(forecastAnalysis, [
        "Light windbreaker",
      ]) || {
        item: "Light windbreaker",
        reason:
          "A thin wind-resistant layer could make the selected window more comfortable.",
      }
    );
  }

  if (
    selectedConditions.lowestFeelsLike <=
    RECOMMENDATION_CONFIG.decision.optionalCoolFeelsLike
  ) {
    return (
      findSuggestion(forecastAnalysis, ["Light layer"]) || {
        item: "Light layer",
        reason:
          "A hoodie, overshirt, or thin layer is optional if you get cold easily.",
      }
    );
  }

  return null;
}

export function mapScoreToRecommendation(
  score,
  weather,
  forecastAnalysis
) {
  const decisionConfig = RECOMMENDATION_CONFIG.decision;
  const selectedConditions = getSelectedConditions(
    weather,
    forecastAnalysis
  );

  const rainy =
    selectedConditions.sustainedRainRisk ||
    selectedConditions.rainChance >=
      decisionConfig.optionalRainChance ||
    selectedConditions.condition.includes("rain") ||
    selectedConditions.condition.includes("drizzle") ||
    selectedConditions.condition.includes("shower");

  const windy =
    selectedConditions.windSpeed >=
    decisionConfig.optionalWindSpeed;

  const optionalLayer = buildOptionalLayer({
    rainy,
    windy,
    selectedConditions,
    forecastAnalysis,
  });

  if (score <= decisionConfig.clearNoMaximum) {
    let summary =
      "You should be comfortable without a jacket for the selected window.";

    if (rainy) {
      summary =
        "You do not need a jacket for warmth, but a light rain layer may still be useful.";
    } else if (windy) {
      summary =
        "You do not need a jacket for warmth, but a light wind layer may still be useful.";
    }

    return {
      decision: "NO",
      jacketType: "No jacket",
      primaryItem: "No jacket",
      summary,
      optionalLayer,
      recommendationBasis: "comfort_no",
    };
  }

  if (score <= decisionConfig.backupLayerNoMaximum) {
    return {
      decision: "NO",
      jacketType: "No jacket needed",
      primaryItem: "No jacket",
      summary:
        "You probably do not need a jacket, but a light backup layer could be useful depending on your comfort.",
      optionalLayer,
      recommendationBasis: "borderline_no",
    };
  }

  if (score <= decisionConfig.lightJacketMaximum) {
    return {
      decision: "YES",
      jacketType: rainy
        ? "Light rain jacket"
        : windy
          ? "Windbreaker"
          : "Light jacket or hoodie",
      summary: rainy
        ? "Wear a light rain jacket because rain is part of the selected forecast."
        : windy
          ? "A windbreaker makes sense because the selected window may be breezy."
          : "A light jacket or hoodie should be enough.",
      primaryItem: rainy
        ? "Light rain jacket"
        : windy
          ? "Windbreaker"
          : "Light jacket",
      optionalLayer: null,
      recommendationBasis: "light_warmth",
    };
  }

  if (score <= decisionConfig.mediumJacketMaximum) {
    return {
      decision: "YES",
      jacketType: rainy
        ? "Water-resistant jacket"
        : windy
          ? "Wind-resistant jacket"
          : "Medium jacket",
      summary: rainy
        ? "Wear a water-resistant jacket for the cooler, wetter conditions."
        : windy
          ? "Wear something with reliable wind protection."
          : "A real jacket is recommended for the selected window.",
      primaryItem: rainy
        ? "Water-resistant jacket"
        : windy
          ? "Wind-resistant jacket"
          : "Medium jacket",
      optionalLayer: null,
      recommendationBasis: "medium_warmth",
    };
  }

  if (score <= decisionConfig.insulatedJacketMaximum) {
    return {
      decision: "YES",
      jacketType: rainy
        ? "Insulated waterproof jacket"
        : "Insulated jacket",
      summary: rainy
        ? "Wear something warm and water-resistant."
        : "You should wear an insulated jacket.",
      primaryItem: rainy
        ? "Insulated waterproof jacket"
        : "Insulated jacket",
      optionalLayer: null,
      recommendationBasis: "insulated_warmth",
    };
  }

  return {
    decision: "YES",
    jacketType: "Heavy coat",
    summary:
      "Bundle up. The selected forecast window is very cold.",
    primaryItem: "Heavy coat",
    optionalLayer: null,
    recommendationBasis: "severe_cold",
  };
}
