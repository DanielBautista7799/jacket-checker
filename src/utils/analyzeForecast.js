import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";
import {
  getForecastWindowHours,
  getTimeWindowLabel,
} from "./timeWindows.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getNumericValues(hours, key) {
  return hours
    .map((hour) => toFiniteNumber(hour?.[key], null))
    .filter((value) => value !== null);
}

function getTemperatureValues(hours) {
  return hours
    .map((hour) => {
      const temperature = toFiniteNumber(hour?.temperature, null);

      if (temperature !== null) {
        return temperature;
      }

      return toFiniteNumber(hour?.temp, null);
    })
    .filter((value) => value !== null);
}

function getMinimum(values, fallback) {
  return values.length > 0 ? Math.min(...values) : fallback;
}

function getMaximum(values, fallback) {
  return values.length > 0 ? Math.max(...values) : fallback;
}

function getAverage(values, fallback) {
  if (values.length === 0) {
    return fallback;
  }

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function getCoolerHalfAverage(values, fallback) {
  if (values.length === 0) {
    return fallback;
  }

  const sorted = [...values].sort((first, second) => first - second);
  const coolerHalfCount = Math.max(1, Math.ceil(sorted.length / 2));
  return getAverage(sorted.slice(0, coolerHalfCount), fallback);
}

function getCurrentForecastHour(weather) {
  const forecastHours = Array.isArray(weather?.forecastHours)
    ? weather.forecastHours
    : [];

  const currentEpoch = toFiniteNumber(
    weather?.currentEpoch,
    null
  );

  if (currentEpoch === null || forecastHours.length === 0) {
    return null;
  }

  return forecastHours.reduce((closestHour, hour) => {
    const hourEpoch = toFiniteNumber(hour?.timeEpoch, null);

    if (hourEpoch === null) {
      return closestHour;
    }

    if (!closestHour) {
      return hour;
    }

    const closestEpoch = toFiniteNumber(
      closestHour.timeEpoch,
      hourEpoch
    );

    const closestDistance = Math.abs(
      closestEpoch - currentEpoch
    );
    const nextDistance = Math.abs(hourEpoch - currentEpoch);

    return nextDistance < closestDistance ? hour : closestHour;
  }, null);
}

function getSelectedCondition(windowHours, fallbackCondition) {
  if (windowHours.length === 0) {
    return fallbackCondition;
  }

  const mostRelevantHour = [...windowHours].sort((first, second) => {
    const firstRain = toFiniteNumber(first?.rainChance, 0);
    const secondRain = toFiniteNumber(second?.rainChance, 0);
    const firstFeelsLike = toFiniteNumber(first?.feelsLike, 100);
    const secondFeelsLike = toFiniteNumber(second?.feelsLike, 100);
    const firstWind = toFiniteNumber(first?.windSpeed, 0);
    const secondWind = toFiniteNumber(second?.windSpeed, 0);

    const firstRisk = firstRain * 0.08 + firstWind * 0.18 + Math.max(0, 66 - firstFeelsLike) * 0.24;
    const secondRisk = secondRain * 0.08 + secondWind * 0.18 + Math.max(0, 66 - secondFeelsLike) * 0.24;

    return secondRisk - firstRisk;
  })[0];

  return mostRelevantHour?.condition || fallbackCondition;
}

function formatHour(value = "") {
  const time = String(value).split(" ")[1] || value;
  const [rawHour, minute = "00"] = time.split(":");
  const hour = Number(rawHour);

  if (!Number.isFinite(hour)) {
    return time;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minute} ${suffix}`;
}

function getWindowTimeRange(windowHours) {
  if (windowHours.length === 0) {
    return "";
  }

  const first = formatHour(windowHours[0]?.time);
  const last = formatHour(windowHours[windowHours.length - 1]?.time);

  if (!first) {
    return "";
  }

  return first === last || !last ? first : `${first}–${last}`;
}

function getCoverageLevel(windowId, hourCount) {
  if (windowId === "now") {
    return "current";
  }

  if (hourCount === 0) {
    return "missing";
  }

  if (windowId === "tomorrow" && hourCount < 8) {
    return "partial";
  }

  if (windowId === "tomorrow_night" && hourCount < 4) {
    return "partial";
  }

  if (windowId === "rest_of_day" && hourCount < 2) {
    return "partial";
  }

  return "complete";
}

export function analyzeForecast(
  weather,
  windowId = "rest_of_day"
) {
  const alerts = [];
  const bringAlongSuggestions = [];
  const windowConfig = RECOMMENDATION_CONFIG.forecastWindow;

  const windowHours = getForecastWindowHours(weather, windowId);
  const windowLabel = getTimeWindowLabel(windowId);
  const windowTimeRange = getWindowTimeRange(windowHours);
  const currentForecastHour = getCurrentForecastHour(weather);

  const currentFeelsLike = toFiniteNumber(
    weather?.feelsLike,
    RECOMMENDATION_CONFIG.weatherScore.defaultFeelsLike
  );

  const currentTemperature = toFiniteNumber(
    weather?.temperature,
    currentFeelsLike
  );

  const currentRainChance = toFiniteNumber(
    currentForecastHour?.rainChance,
    toFiniteNumber(weather?.rainChance, 0)
  );

  const currentWind = toFiniteNumber(weather?.windSpeed, 0);

  const fallbackMaxWind = toFiniteNumber(
    weather?.maxWind,
    currentWind
  );

  const feelsLikeValues = getNumericValues(
    windowHours,
    "feelsLike"
  );
  const temperatureValues = getTemperatureValues(windowHours);
  const rainValues = getNumericValues(windowHours, "rainChance");
  const windValues = getNumericValues(windowHours, "windSpeed");

  const lowestWindowFeelsLike = getMinimum(
    feelsLikeValues,
    currentFeelsLike
  );

  const highestWindowFeelsLike = getMaximum(
    feelsLikeValues,
    currentFeelsLike
  );

  const averageWindowFeelsLike = getAverage(
    feelsLikeValues,
    currentFeelsLike
  );

  const decisionWindowFeelsLike = getCoolerHalfAverage(
    feelsLikeValues,
    averageWindowFeelsLike
  );

  const averageWindowTemperature = getAverage(
    temperatureValues,
    currentTemperature
  );

  const highestWindowRainChance = getMaximum(
    rainValues,
    currentRainChance
  );

  const highestWindowWind = getMaximum(
    windValues,
    fallbackMaxWind
  );

  const rainyHourCount = rainValues.filter(
    (value) => value >= windowConfig.sustainedRainChance
  ).length;

  const rainCoverageRatio =
    rainValues.length > 0 ? rainyHourCount / rainValues.length : 0;

  const sustainedRainRisk =
    windowId !== "now" &&
    rainyHourCount >= windowConfig.sustainedRainMinimumHours &&
    rainCoverageRatio >= windowConfig.sustainedRainCoverage;

  const selectedWindowStartFeelsLike =
    feelsLikeValues[0] ?? currentFeelsLike;

  const tempDrop = Math.max(
    0,
    selectedWindowStartFeelsLike - lowestWindowFeelsLike
  );

  const selectedConditions = {
    feelsLike:
      windowId === "now"
        ? currentFeelsLike
        : decisionWindowFeelsLike,
    averageFeelsLike:
      windowId === "now"
        ? currentFeelsLike
        : averageWindowFeelsLike,
    temperature:
      windowId === "now"
        ? currentTemperature
        : averageWindowTemperature,
    rainChance:
      windowId === "now"
        ? currentRainChance
        : highestWindowRainChance,
    windSpeed:
      windowId === "now"
        ? currentWind
        : highestWindowWind,
    lowestFeelsLike:
      windowId === "now"
        ? currentFeelsLike
        : lowestWindowFeelsLike,
    highestFeelsLike:
      windowId === "now"
        ? currentFeelsLike
        : highestWindowFeelsLike,
    condition:
      windowId === "now"
        ? weather?.condition || "Unknown"
        : getSelectedCondition(
            windowHours,
            weather?.condition || "Unknown"
          ),
    rainyHourCount,
    rainCoverageRatio,
    sustainedRainRisk,
    hourCount: windowId === "now" ? 1 : windowHours.length,
    usesForecastHours:
      windowId !== "now" && windowHours.length > 0,
  };

  if (windowId !== "now") {
    if (
      highestWindowRainChance >=
      RECOMMENDATION_CONFIG.protectionOverride.rainChance
    ) {
      alerts.push({
        type: "rain",
        message: `Rain is likely during ${windowLabel.toLowerCase()}, reaching about ${Math.round(
          highestWindowRainChance
        )}%.`,
      });

      bringAlongSuggestions.push({
        item: "Light rain shell",
        reason:
          "Rain is likely, so a packable waterproof layer may be useful.",
      });
    } else if (sustainedRainRisk) {
      alerts.push({
        type: "rain",
        message: `Rain risk stays near ${Math.round(
          highestWindowRainChance
        )}% through much of ${windowLabel.toLowerCase()}.`,
      });

      bringAlongSuggestions.push({
        item: "Light rain shell",
        reason:
          "Rain risk persists across the selected hours, so a light waterproof layer is the safer call.",
      });
    } else if (highestWindowRainChance >= 35) {
      alerts.push({
        type: "rain",
        message: `There is some rain risk during ${windowLabel.toLowerCase()}, reaching about ${Math.round(
          highestWindowRainChance
        )}%.`,
      });

      bringAlongSuggestions.push({
        item: "Packable rain layer",
        reason:
          "Rain is possible, so a small waterproof backup could help.",
      });
    }

    if (lowestWindowFeelsLike <= 55) {
      bringAlongSuggestions.push({
        item: "Light layer",
        reason: `It may feel as cool as ${Math.round(
          lowestWindowFeelsLike
        )}°F during the selected window.`,
      });
    }

    if (lowestWindowFeelsLike <= 45) {
      alerts.push({
        type: "chilly",
        message: `It may feel around ${Math.round(
          lowestWindowFeelsLike
        )}°F during ${windowLabel.toLowerCase()}.`,
      });
    } else if (tempDrop >= 8) {
      alerts.push({
        type: "temperature-drop",
        message: `Temperatures may drop around ${Math.round(
          tempDrop
        )}°F during ${windowLabel.toLowerCase()}.`,
      });
    }

    if (
      highestWindowWind >=
      RECOMMENDATION_CONFIG.protectionOverride.windSpeed
    ) {
      alerts.push({
        type: "wind",
        message: `Wind may reach ${Math.round(
          highestWindowWind
        )} mph during ${windowLabel.toLowerCase()}.`,
      });

      bringAlongSuggestions.push({
        item: "Light windbreaker",
        reason:
          "Strong wind may make the selected window feel cooler.",
      });
    } else if (highestWindowWind >= 16) {
      alerts.push({
        type: "wind",
        message: `Breezy conditions may reach ${Math.round(
          highestWindowWind
        )} mph during ${windowLabel.toLowerCase()}.`,
      });
    }
  }

  const uniqueBringAlongSuggestions =
    bringAlongSuggestions.filter(
      (suggestion, index, suggestions) =>
        index ===
        suggestions.findIndex(
          (item) => item.item === suggestion.item
        )
    );

  return {
    windowId,
    windowLabel,
    windowTimeRange,
    windowHours,
    alerts,
    bringAlongSuggestions: uniqueBringAlongSuggestions,
    lowestWindowFeelsLike,
    highestWindowFeelsLike,
    averageWindowFeelsLike,
    decisionWindowFeelsLike,
    averageWindowTemperature,
    highestWindowRainChance,
    highestWindowWind,
    rainyHourCount,
    rainCoverageRatio,
    sustainedRainRisk,
    tempDrop,
    selectedConditions,
    coverageLevel: getCoverageLevel(
      windowId,
      windowHours.length
    ),
  };
}
