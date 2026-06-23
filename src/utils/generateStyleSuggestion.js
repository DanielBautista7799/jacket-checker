import {
  getJacketColorPairing,
  getProfileColorPairing,
  getStyleSuggestionTemplate,
} from "../data/styleSuggestionLibrary";

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

function joinChoices(values = []) {
  const unique = [...new Set(values.filter(Boolean))];

  if (unique.length === 0) {
    return "neutral";
  }

  if (unique.length === 1) {
    return unique[0];
  }

  return `${unique[0]} or ${unique[1]}`;
}

function getSelectedWeather(weather, forecastAnalysis) {
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
  };
}

function getTemperatureBand(feelsLike) {
  if (feelsLike >= 72) {
    return "warm";
  }

  if (feelsLike < 50) {
    return "cold";
  }

  return "mild";
}

function getFitPhrase(fitPreference) {
  const phrases = {
    relaxed: "Keep the shapes relaxed",
    fitted: "Keep the fit clean and slightly fitted",
    oversized: "Lean into an oversized silhouette",
    layered: "Keep the layers simple and balanced",
  };

  return phrases[fitPreference] || "Keep the proportions balanced";
}

function getWeatherNote(selectedWeather) {
  if (
    selectedWeather.rainChance >= 55 &&
    selectedWeather.windSpeed >= 20
  ) {
    return "Rain and wind are both in play, so keep the shoes weather-friendly and avoid bulky layers under the jacket.";
  }

  if (selectedWeather.rainChance >= 55) {
    return "Rain is likely, so keep the shoes weather-friendly and add a compact umbrella if needed.";
  }

  if (selectedWeather.windSpeed >= 20) {
    return "It may get windy, so keep the layers close and avoid anything overly loose.";
  }

  if (selectedWeather.feelsLike < 45) {
    return "It will feel cold, so use a warmer base or knit without changing the overall look.";
  }

  if (selectedWeather.feelsLike >= 78) {
    return "Keep the base layer light so the outfit does not feel too warm.";
  }

  return "Keep the outfit simple and let the proportions and colors do the work.";
}

function buildColorSentence(pairing, jacketColor, hasJacket) {
  const topColors = joinChoices(pairing.tops);
  const bottomColors = joinChoices(pairing.bottoms);
  const shoeColors = joinChoices(pairing.shoes);

  if (hasJacket) {
    return `With the ${formatLabel(
      jacketColor
    ).toLowerCase()} jacket, use a ${topColors} top, ${bottomColors} pants, and ${shoeColors} shoes.`;
  }

  return `Try a ${topColors} top, ${bottomColors} pants, and ${shoeColors} shoes.`;
}

export function generateStyleSuggestion({
  recommendation,
  weather,
  profile,
  closetItem = null,
  forecastAnalysis = null,
}) {
  if (!recommendation || !profile) {
    return null;
  }

  const stylePreference = profile.style_preference || "streetwear";
  const fitPreference = profile.fit_preference || "relaxed";
  const preferredColor = profile.preferred_color || "black";

  const styleTemplate = getStyleSuggestionTemplate(stylePreference);
  const selectedWeather = getSelectedWeather(weather, forecastAnalysis);
  const temperatureBand = getTemperatureBand(selectedWeather.feelsLike);
  const temperatureTemplate = styleTemplate[temperatureBand];

  const hasJacket =
    recommendation.decision === "YES" && Boolean(closetItem);

  const jacketColor =
    closetItem?.primary_color || closetItem?.color || preferredColor;

  const colorPairing = hasJacket
    ? getJacketColorPairing(jacketColor)
    : getProfileColorPairing(preferredColor);

  const baseDirection = `${getFitPhrase(
    fitPreference
  )}: ${temperatureTemplate.top}, ${temperatureTemplate.bottoms}, and ${temperatureTemplate.shoes}.`;

  const colorDirection = buildColorSentence(
    colorPairing,
    jacketColor,
    hasJacket
  );

  const weatherNote = getWeatherNote(selectedWeather);

  return {
    version: 3,
    type: "style_suggestion",
    title: `${styleTemplate.label} fit idea`,
    style: stylePreference,
    styleLabel: styleTemplate.label,
    jacketColor: hasJacket ? jacketColor : null,
    summary: `${colorDirection} ${baseDirection}`,
    weatherNote,
    reason: `This stays ${styleTemplate.tone} and follows your saved ${styleTemplate.label.toLowerCase()} preference.`,
  };
}
