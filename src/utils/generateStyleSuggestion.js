import {
  getColorPlanOptions,
  getProfileColorPlanOptions,
  getStyleSuggestionTemplate,
  normalizeStyleColor,
} from "../data/styleSuggestionLibrary.js";
import { getStyleStrategyPreferenceScore } from "./feedbackLearning.js";
import { applyTrendRules } from "./applyTrendRules.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatLabel(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function selectBySeed(values, seed, offset = 0) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const index = (seed + Math.imul(offset + 1, 2654435761)) >>> 0;
  return values[index % values.length];
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function getSelectedWeather(weather, forecastAnalysis) {
  const selected = forecastAnalysis?.selectedConditions || {};
  const condition = String(
    selected.condition || weather?.condition || ""
  ).toLowerCase();

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
    condition,
  };
}

function getTemperatureBand(selectedWeather) {
  const effectiveTemperature = Math.min(
    selectedWeather.feelsLike,
    selectedWeather.lowestFeelsLike + 4
  );

  if (effectiveTemperature >= 80) {
    return "hot";
  }

  if (effectiveTemperature >= 70) {
    return "warm";
  }

  if (effectiveTemperature < 50) {
    return "cold";
  }

  return "mild";
}

function getWeatherState(selectedWeather, temperatureBand) {
  const rainyCondition = includesAny(selectedWeather.condition, [
    "rain",
    "drizzle",
    "shower",
    "storm",
    "sleet",
    "snow",
    "freezing",
    "ice",
  ]);

  const rainy = selectedWeather.rainChance >= 50 || rainyCondition;
  const windy = selectedWeather.windSpeed >= 18;

  if (rainy && windy) {
    return "rain_wind";
  }

  if (rainy) {
    return "rain";
  }

  if (windy) {
    return "wind";
  }

  if (temperatureBand === "cold") {
    return "cold";
  }

  if (temperatureBand === "hot") {
    return "hot";
  }

  return "default";
}

function getTemplateBand(temperatureBand) {
  return temperatureBand === "hot" ? "warm" : temperatureBand;
}

function getDateSeed(weather) {
  if (typeof weather?.localTime === "string" && weather.localTime) {
    return weather.localTime.split(" ")[0] || weather.localTime;
  }

  const epoch = toFiniteNumber(weather?.currentEpoch, null);

  if (epoch !== null) {
    return new Date(epoch * 1000).toISOString().slice(0, 10);
  }

  return "stable-date";
}

function buildSuggestionSeed({
  recommendation,
  weather,
  profile,
  closetItem,
  forecastAnalysis,
  primaryColor,
  secondaryColor,
}) {
  return [
    profile?.style_preference || "streetwear",
    profile?.fit_preference || "relaxed",
    recommendation?.decision || "NO",
    recommendation?.recommendationBasis || "temperature",
    closetItem?.id || "no-jacket",
    primaryColor,
    secondaryColor || "no-secondary",
    weather?.city || "unknown-city",
    forecastAnalysis?.windowId || "rest_of_day",
    getDateSeed(weather),
  ].join("|");
}

function getFitDirection(styleTemplate, fitPreference, seed) {
  const options =
    styleTemplate.fitDirections?.[fitPreference] ||
    styleTemplate.fitDirections?.default ||
    ["Keep the proportions balanced"];

  return selectBySeed(options, seed, 1) || "Keep the proportions balanced";
}

function getWeatherNote(styleTemplate, weatherState, seed) {
  const options =
    styleTemplate.weatherNotes?.[weatherState] ||
    styleTemplate.weatherNotes?.default ||
    [];

  return selectBySeed(options, seed, 2) || null;
}

function getSecondaryAccentNote({
  primaryColor,
  secondaryColor,
  selectedColors,
}) {
  if (
    !secondaryColor ||
    secondaryColor === "other" ||
    secondaryColor === "multicolor" ||
    secondaryColor === primaryColor
  ) {
    return null;
  }

  const readableSecondary = formatLabel(secondaryColor).toLowerCase();
  const alreadyUsed = selectedColors.some(
    (color) => normalizeStyleColor(color) === secondaryColor
  );

  if (alreadyUsed) {
    return `let the ${readableSecondary} detail stay as the accent`;
  }

  return `use one small ${readableSecondary} accent to tie it together`;
}

function buildPiecePhrase(piece, color, includeArticle = false) {
  const phrase = `${piece} in ${formatLabel(color).toLowerCase()}`;

  if (!includeArticle) {
    return phrase;
  }

  const firstCharacter = phrase.trim().charAt(0).toLowerCase();
  const article = ["a", "e", "i", "o", "u"].includes(firstCharacter)
    ? "an"
    : "a";

  return `${article} ${phrase}`;
}

function buildSummary({
  hasJacket,
  primaryColor,
  topPiece,
  topColor,
  bottomPiece,
  bottomColor,
  shoePiece,
  shoeColor,
  fitDirection,
  accentNote,
  seed,
}) {
  const jacketColor = formatLabel(primaryColor).toLowerCase();
  const outfit = `${buildPiecePhrase(
    topPiece,
    topColor,
    true
  )}, ${buildPiecePhrase(
    bottomPiece,
    bottomColor
  )}, and ${buildPiecePhrase(shoePiece, shoeColor)}`;

  const yesStarters = [
    `With the ${jacketColor} jacket, go with`,
    `Build around the ${jacketColor} jacket with`,
    `Pair the ${jacketColor} jacket with`,
  ];

  const noStarters = [
    "Go with",
    "Keep it simple with",
    "Try",
  ];

  const starter = selectBySeed(
    hasJacket ? yesStarters : noStarters,
    seed,
    3
  );

  const closer = accentNote
    ? `${fitDirection}, and ${accentNote}.`
    : `${fitDirection}.`;

  return `${starter} ${outfit}. ${closer}`;
}

function selectColorPlan({
  plans,
  preferenceModel,
  stylePreference,
  weatherState,
  temperatureBand,
  seed,
}) {
  if (!Array.isArray(plans) || plans.length === 0) {
    return {
      plan: null,
      learningScore: 0,
    };
  }

  const scoredPlans = plans.map((plan, index) => ({
    plan,
    learningScore: getStyleStrategyPreferenceScore({
      preferenceModel,
      style: stylePreference,
      strategy: plan.key,
      weatherState,
      temperatureBand,
    }),
    tieBreak: hashString(`${seed}|${plan.key}|${index}`),
  }));

  const hasLearnedPreference = scoredPlans.some(
    (entry) => Math.abs(entry.learningScore) >= 0.25
  );

  if (!hasLearnedPreference) {
    return {
      plan: selectBySeed(plans, seed, 4),
      learningScore: 0,
    };
  }

  scoredPlans.sort((first, second) => {
    if (second.learningScore !== first.learningScore) {
      return second.learningScore - first.learningScore;
    }

    return second.tieBreak - first.tieBreak;
  });

  return {
    plan: scoredPlans[0].plan,
    learningScore: scoredPlans[0].learningScore,
  };
}

export function generateStyleSuggestion({
  recommendation,
  weather,
  profile,
  closetItem = null,
  forecastAnalysis = null,
  preferenceModel = null,
  activeTrendRules = [],
  trendPreferenceModel = null,
  trendSource = "none",
}) {
  if (!recommendation || !profile) {
    return null;
  }

  const stylePreference = profile.style_preference || "streetwear";
  const fitPreference = profile.fit_preference || "relaxed";
  const preferredColor = profile.preferred_color || "black";
  const styleTemplate = getStyleSuggestionTemplate(stylePreference);
  const selectedWeather = getSelectedWeather(weather, forecastAnalysis);
  const temperatureBand = getTemperatureBand(selectedWeather);
  const templateBand = getTemplateBand(temperatureBand);
  const weatherState = getWeatherState(
    selectedWeather,
    temperatureBand
  );

  const hasJacket =
    recommendation.decision === "YES" && Boolean(closetItem);

  const primaryColor = normalizeStyleColor(
    closetItem?.primary_color || closetItem?.color || preferredColor
  );

  const secondaryColor = normalizeStyleColor(
    closetItem?.secondary_color || "other"
  );

  const colorOptions = hasJacket
    ? getColorPlanOptions(primaryColor)
    : getProfileColorPlanOptions(preferredColor);

  const seedText = buildSuggestionSeed({
    recommendation,
    weather,
    profile,
    closetItem,
    forecastAnalysis,
    primaryColor,
    secondaryColor,
  });

  const seed = hashString(seedText);
  const selectedPlan = selectColorPlan({
    plans: colorOptions.plans,
    preferenceModel,
    stylePreference,
    weatherState,
    temperatureBand,
    seed,
  });

  const colorPlan = selectedPlan.plan;
  const temperatureTemplate =
    styleTemplate[templateBand] || styleTemplate.mild;

  const topPiece = selectBySeed(
    temperatureTemplate.tops,
    seed,
    5
  );
  const bottomPiece = selectBySeed(
    temperatureTemplate.bottoms,
    seed,
    6
  );
  const shoePiece = selectBySeed(
    temperatureTemplate.shoes,
    seed,
    7
  );

  const topColor = selectBySeed(colorPlan?.tops, seed, 8) || "neutral";
  const bottomColor =
    selectBySeed(colorPlan?.bottoms, seed, 9) || "neutral";
  const shoeColor =
    selectBySeed(colorPlan?.shoes, seed, 10) || "neutral";

  const fitDirection = getFitDirection(
    styleTemplate,
    fitPreference,
    seed
  );

  const accentNote = getSecondaryAccentNote({
    primaryColor,
    secondaryColor,
    selectedColors: [topColor, bottomColor, shoeColor],
  });

  const weatherNote = getWeatherNote(
    styleTemplate,
    weatherState,
    seed
  );

  const summary = buildSummary({
    hasJacket,
    primaryColor,
    topPiece,
    topColor,
    bottomPiece,
    bottomColor,
    shoePiece,
    shoeColor,
    fitDirection,
    accentNote,
    seed,
  });

  const baseSuggestion = {
    version: 6,
    type: "style_suggestion",
    title: hasJacket
      ? `${styleTemplate.label} · ${formatLabel(primaryColor)} jacket`
      : `${styleTemplate.label} fit idea`,
    style: stylePreference,
    styleLabel: styleTemplate.label,
    jacketColor: hasJacket ? primaryColor : null,
    secondaryColor:
      hasJacket && secondaryColor !== "other"
        ? secondaryColor
        : null,
    temperatureBand,
    weatherState,
    colorStrategy: colorPlan?.key || "balanced_neutral",
    variantKey: hashString(seedText).toString(36),
    summary,
    weatherNote,
    learningInfluence:
      selectedPlan.learningScore > 0.5
        ? "positive"
        : selectedPlan.learningScore < -0.5
          ? "avoid_negative"
          : "neutral",
    reason: `This keeps the suggestion ${styleTemplate.tone}, weather-aware, and intentionally broad rather than claiming you own exact pieces.`,
  };

  const localDate = weather?.localTime
    ? new Date(String(weather.localTime).replace(" ", "T"))
    : weather?.currentEpoch
      ? new Date(Number(weather.currentEpoch) * 1000)
      : new Date();

  return applyTrendRules({
    styleSuggestion: baseSuggestion,
    rules: activeTrendRules,
    profile,
    style: stylePreference,
    jacket: closetItem,
    temperatureBand,
    weatherState,
    rainChance: selectedWeather.rainChance,
    windSpeed: selectedWeather.windSpeed,
    trendPreferenceModel,
    source: trendSource,
    date: Number.isNaN(localDate.getTime()) ? new Date() : localDate,
    seedText,
  });
}
