import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function addModifier(breakdown, key, score, reason) {
  if (score === 0) {
    return;
  }

  breakdown.push({
    key,
    score,
    reason,
  });
}

export function calculateProfileModifier(
  profile,
  weather,
  forecastAnalysis = null
) {
  const config = RECOMMENDATION_CONFIG.profile;
  const profileReasons = [];
  const modifierBreakdown = [];

  if (!profile) {
    return {
      modifier: 0,
      profileReasons,
      modifierBreakdown,
      selectedConditions:
        forecastAnalysis?.selectedConditions || {},
    };
  }

  const selectedConditions =
    forecastAnalysis?.selectedConditions || {};

  const feelsLike = toFiniteNumber(
    selectedConditions.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
  );

  const rainChance = toFiniteNumber(
    selectedConditions.rainChance,
    toFiniteNumber(weather?.rainChance, 0)
  );

  const windSpeed = toFiniteNumber(
    selectedConditions.windSpeed,
    toFiniteNumber(weather?.windSpeed, 0)
  );

  const coldToleranceScore =
    config.coldTolerance[profile.cold_tolerance] || 0;

  if (coldToleranceScore > 0) {
    const reason = "Your profile says you run cold.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "cold_tolerance",
      coldToleranceScore,
      reason
    );
  } else if (coldToleranceScore < 0) {
    const reason = "Your profile says you run hot.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "cold_tolerance",
      coldToleranceScore,
      reason
    );
  }

  if (rainChance >= config.rainSensitivity.threshold) {
    const rainSensitivityScore =
      config.rainSensitivity[profile.rain_sensitivity] || 0;

    if (rainSensitivityScore > 0) {
      const reason =
        "Your profile says rain affects your comfort more than average.";
      profileReasons.push(reason);
      addModifier(
        modifierBreakdown,
        "rain_sensitivity",
        rainSensitivityScore,
        reason
      );
    } else if (rainSensitivityScore < 0) {
      const reason =
        "Your profile says rain bothers you less than average.";
      profileReasons.push(reason);
      addModifier(
        modifierBreakdown,
        "rain_sensitivity",
        rainSensitivityScore,
        reason
      );
    }
  }

  if (windSpeed >= config.windSensitivity.threshold) {
    const windSensitivityScore =
      config.windSensitivity[profile.wind_sensitivity] || 0;

    if (windSensitivityScore > 0) {
      const reason =
        "Your profile says wind affects your comfort more than average.";
      profileReasons.push(reason);
      addModifier(
        modifierBreakdown,
        "wind_sensitivity",
        windSensitivityScore,
        reason
      );
    } else if (windSensitivityScore < 0) {
      const reason =
        "Your profile says wind bothers you less than average.";
      profileReasons.push(reason);
      addModifier(
        modifierBreakdown,
        "wind_sensitivity",
        windSensitivityScore,
        reason
      );
    }
  }

  if (
    profile.default_exposure === "long" &&
    feelsLike < config.exposure.long.feelsLikeBelow
  ) {
    const reason =
      "Your usual time outside is long, so sustained conditions matter more.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "exposure",
      config.exposure.long.score,
      reason
    );
  }

  if (
    profile.default_exposure === "medium" &&
    feelsLike < config.exposure.medium.feelsLikeBelow
  ) {
    const reason =
      "Your usual time outside is long enough for cooler conditions to matter.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "exposure",
      config.exposure.medium.score,
      reason
    );
  }

  if (
    profile.default_exposure === "short" &&
    feelsLike > config.exposure.short.feelsLikeAbove
  ) {
    const reason =
      "Your usual time outside is short, so milder conditions are easier to handle.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "exposure",
      config.exposure.short.score,
      reason
    );
  }

  if (
    profile.age &&
    profile.age >= config.age.minimum &&
    feelsLike < config.age.feelsLikeBelow
  ) {
    const reason =
      "Your age range adds a small warmth buffer in cooler weather.";
    profileReasons.push(reason);
    addModifier(
      modifierBreakdown,
      "age",
      config.age.score,
      reason
    );
  }

  const modifier = modifierBreakdown.reduce(
    (total, entry) => total + entry.score,
    0
  );

  return {
    modifier,
    profileReasons,
    modifierBreakdown,
    selectedConditions: {
      ...selectedConditions,
      feelsLike,
      rainChance,
      windSpeed,
    },
  };
}
