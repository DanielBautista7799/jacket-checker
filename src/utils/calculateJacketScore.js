import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";
import { analyzeForecast } from "./analyzeForecast.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function findBand(value, bands, comparisonKey) {
  return (
    bands.find((band) => value >= band[comparisonKey]) ||
    bands[bands.length - 1]
  );
}

function getTemperatureReason(feelsLike, windowLabel, bandKey) {
  const roundedFeelsLike = Math.round(feelsLike);

  const messages = {
    hot: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is warm.`,
    warm: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is mild.`,
    mild: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, so a jacket is probably unnecessary.`,
    light_layer_optional: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, so a light layer is optional.`,
    cool: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is cool.`,
    jacket_weather: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is jacket weather.`,
    cold: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is cold.`,
    very_cold: `It should feel around ${roundedFeelsLike}°F during ${windowLabel}, which is very cold.`,
  };

  return messages[bandKey] || messages.mild;
}

function buildBaseConfidence({
  score,
  windowId,
  forecastAnalysis,
}) {
  const reasons = [];
  let level = "high";

  if (
    windowId !== "now" &&
    forecastAnalysis.coverageLevel === "missing"
  ) {
    level = "low";
    reasons.push(
      "The selected forecast window did not include usable hourly data."
    );
  } else if (
    windowId !== "now" &&
    forecastAnalysis.coverageLevel === "partial"
  ) {
    level = "medium";
    reasons.push(
      "Only part of the selected forecast window was available."
    );
  }

  if (score >= 1 && score <= 4 && level === "high") {
    level = "medium";
    reasons.push(
      "Conditions are close to the YES or NO boundary."
    );
  }

  if (
    forecastAnalysis.tempDrop >=
      RECOMMENDATION_CONFIG.weatherScore.temperatureDrop.minimum &&
    level === "high"
  ) {
    level = "medium";
    reasons.push(
      "Conditions change noticeably during the selected window."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "The selected forecast clearly supports this recommendation."
    );
  }

  return {
    level,
    reasons,
  };
}

export function calculateJacketScore({
  weather,
  windowId = "rest_of_day",
}) {
  const config = RECOMMENDATION_CONFIG.weatherScore;
  const reasons = [];
  const forecastAnalysis = analyzeForecast(weather, windowId);
  const selectedConditions = forecastAnalysis.selectedConditions;

  const feelsLike = toFiniteNumber(
    selectedConditions?.feelsLike,
    toFiniteNumber(weather?.feelsLike, config.defaultFeelsLike)
  );

  const rainChance = toFiniteNumber(
    selectedConditions?.rainChance,
    toFiniteNumber(weather?.rainChance, 0)
  );

  const windSpeed = toFiniteNumber(
    selectedConditions?.windSpeed,
    toFiniteNumber(weather?.windSpeed, 0)
  );

  const lowestFeelsLike = toFiniteNumber(
    selectedConditions?.lowestFeelsLike,
    feelsLike
  );

  const windowLabel = forecastAnalysis.windowLabel.toLowerCase();

  const temperatureBand = findBand(
    feelsLike,
    config.temperatureBands,
    "minimum"
  );

  const temperatureScore = temperatureBand.score;
  reasons.push(
    getTemperatureReason(
      feelsLike,
      windowLabel,
      temperatureBand.key
    )
  );

  const windBand = findBand(
    windSpeed,
    config.windBands,
    "minimum"
  );

  const windScore =
    windBand && windSpeed >= windBand.minimum
      ? windBand.score
      : 0;

  if (windScore > 0) {
    reasons.push(
      `Wind may reach ${Math.round(
        windSpeed
      )} mph during the selected window.`
    );
  }

  const rainBand = findBand(
    rainChance,
    config.rainBands,
    "minimum"
  );

  const rainScore =
    rainBand && rainChance >= rainBand.minimum
      ? rainBand.score
      : 0;

  if (rainScore >= 2) {
    reasons.push(
      `Rain chance may reach ${Math.round(
        rainChance
      )}% during the selected window.`
    );
  } else if (rainScore === 1) {
    reasons.push(
      "There is some rain risk during the selected window."
    );
  }

  let forecastLowScore = 0;

  if (windowId !== "now") {
    if (
      lowestFeelsLike <= config.forecastLow.coldThreshold &&
      feelsLike > config.forecastLow.coldThreshold
    ) {
      forecastLowScore = config.forecastLow.coldScore;
      reasons.push(
        `The coldest part of the window may feel like ${Math.round(
          lowestFeelsLike
        )}°F.`
      );
    } else if (
      lowestFeelsLike <= config.forecastLow.coolThreshold &&
      feelsLike > config.forecastLow.coolThreshold
    ) {
      forecastLowScore = config.forecastLow.coolScore;
      reasons.push(
        `The coldest part of the window may feel like ${Math.round(
          lowestFeelsLike
        )}°F.`
      );
    }
  }

  let temperatureDropScore = 0;

  if (
    windowId !== "now" &&
    forecastAnalysis.tempDrop >=
      config.temperatureDrop.minimum
  ) {
    temperatureDropScore = config.temperatureDrop.score;
    reasons.push(
      "Conditions cool down noticeably during the selected window."
    );
  }

  const score =
    temperatureScore +
    windScore +
    rainScore +
    forecastLowScore +
    temperatureDropScore;

  return {
    score,
    reasons,
    forecastAnalysis,
    selectedConditions,
    confidence: buildBaseConfidence({
      score,
      windowId,
      forecastAnalysis,
    }),
    scoreBreakdown: {
      temperature: {
        score: temperatureScore,
        band: temperatureBand.key,
        feelsLike,
      },
      wind: {
        score: windScore,
        windSpeed,
      },
      rain: {
        score: rainScore,
        rainChance,
      },
      forecastLow: {
        score: forecastLowScore,
        lowestFeelsLike,
      },
      temperatureDrop: {
        score: temperatureDropScore,
        amount: forecastAnalysis.tempDrop,
      },
      total: score,
    },
  };
}
