export const FEEDBACK_WEIGHTS = {
  fire: 2,
  good: 1,
  not_it: -1,
};

function toFiniteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeToken(value, fallback = null) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((entry) => normalizeToken(entry))
        .filter(Boolean)
    ),
  ];
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

export function clampLearningScore(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getFeedbackWeight(rating) {
  return FEEDBACK_WEIGHTS[rating] || 0;
}

export function createLearningKey(...parts) {
  return parts
    .map((part) => normalizeToken(String(part ?? ""), "unknown"))
    .join("|");
}

export function getTemperatureBandFromConditions(conditions = {}) {
  const feelsLike = toFiniteNumber(conditions.feelsLike, 65);
  const lowestFeelsLike = toFiniteNumber(
    conditions.lowestFeelsLike,
    feelsLike
  );

  const effectiveFeelsLike = Math.min(
    feelsLike,
    lowestFeelsLike + 4
  );

  if (effectiveFeelsLike < 32) {
    return "very_cold";
  }

  if (effectiveFeelsLike < 50) {
    return "cold";
  }

  if (effectiveFeelsLike >= 80) {
    return "hot";
  }

  if (effectiveFeelsLike >= 70) {
    return "warm";
  }

  return "mild";
}

export function getWeatherContextFromConditions(conditions = {}) {
  const condition = String(conditions.condition || "").toLowerCase();
  const rainChance = toFiniteNumber(conditions.rainChance, 0);
  const windSpeed = toFiniteNumber(conditions.windSpeed, 0);

  const rainyCondition = includesAny(condition, [
    "rain",
    "drizzle",
    "shower",
    "storm",
    "thunder",
    "sleet",
    "snow",
    "freezing",
    "ice",
  ]);

  const rainy = rainChance >= 50 || rainyCondition;
  const windy = windSpeed >= 18;

  if (rainy && windy) {
    return "rain_wind";
  }

  if (rainy) {
    return "rain";
  }

  if (windy) {
    return "wind";
  }

  return getTemperatureBandFromConditions(conditions);
}

export function getFeedbackRecencyMultiplier(value) {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;

  if (!Number.isFinite(timestamp)) {
    return 0.75;
  }

  const ageDays = Math.max(
    0,
    (Date.now() - timestamp) / (24 * 60 * 60 * 1000)
  );

  if (ageDays <= 7) {
    return 1;
  }

  if (ageDays <= 30) {
    return 0.9;
  }

  if (ageDays <= 90) {
    return 0.75;
  }

  if (ageDays <= 180) {
    return 0.6;
  }

  return 0.5;
}

function getRecommendationConditions(recommendation) {
  const selected =
    recommendation?.selectedConditions ||
    recommendation?.forecastAnalysis?.selectedConditions ||
    {};

  return {
    feelsLike: toFiniteNumber(selected.feelsLike, 65),
    lowestFeelsLike: toFiniteNumber(
      selected.lowestFeelsLike,
      toFiniteNumber(selected.feelsLike, 65)
    ),
    rainChance: toFiniteNumber(selected.rainChance, 0),
    windSpeed: toFiniteNumber(selected.windSpeed, 0),
    condition: String(selected.condition || ""),
  };
}

export function createRecommendationLearningContext({
  recommendation,
  wardrobeItem = null,
  timeWindow = null,
}) {
  const conditions = getRecommendationConditions(recommendation);
  const styleSuggestion = recommendation?.styleSuggestion || null;

  return {
    version: 1,
    wardrobeItemId: wardrobeItem?.id || null,
    subtype:
      normalizeToken(
        wardrobeItem?.subtype || wardrobeItem?.type,
        "other"
      ) || "other",
    primaryColor:
      normalizeToken(
        wardrobeItem?.primary_color || wardrobeItem?.color,
        "other"
      ) || "other",
    secondaryColor: normalizeToken(
      wardrobeItem?.secondary_color,
      null
    ),
    styleTags: normalizeStringArray(wardrobeItem?.style_tags),
    warmthRating: toFiniteNumber(
      wardrobeItem?.warmth_rating,
      1
    ),
    rainRating: toFiniteNumber(wardrobeItem?.rain_rating, 1),
    windRating: toFiniteNumber(wardrobeItem?.wind_rating, 1),
    forecastWindow:
      normalizeToken(
        timeWindow || recommendation?.forecastAnalysis?.windowId,
        "rest_of_day"
      ) || "rest_of_day",
    weatherContext: getWeatherContextFromConditions(conditions),
    temperatureBand: getTemperatureBandFromConditions(conditions),
    recommendationBasis:
      normalizeToken(
        recommendation?.recommendationBasis,
        "temperature"
      ) || "temperature",
    style: normalizeToken(styleSuggestion?.style, null),
    colorStrategy: normalizeToken(
      styleSuggestion?.colorStrategy,
      null
    ),
    styleWeatherState: normalizeToken(
      styleSuggestion?.weatherState,
      null
    ),
  };
}

export function deriveFeedbackLearningContext({
  feedbackEntry,
  historyEntry = null,
}) {
  const directContext =
    feedbackEntry?.outfit_json?.learningContext ||
    feedbackEntry?.outfit_json?.learning_context ||
    historyEntry?.outfit_json?.learningContext ||
    historyEntry?.outfit_json?.learning_context ||
    null;

  const weatherSnapshot = historyEntry?.weather_snapshot || {};

  const fallbackConditions = {
    feelsLike:
      weatherSnapshot.selectedFeelsLike ??
      weatherSnapshot.feelsLike ??
      65,
    lowestFeelsLike:
      weatherSnapshot.lowestFeelsLike ??
      weatherSnapshot.selectedFeelsLike ??
      weatherSnapshot.feelsLike ??
      65,
    rainChance:
      weatherSnapshot.selectedRainChance ??
      weatherSnapshot.rainChance ??
      0,
    windSpeed:
      weatherSnapshot.selectedWindSpeed ??
      weatherSnapshot.windSpeed ??
      0,
    condition:
      weatherSnapshot.selectedCondition ??
      weatherSnapshot.condition ??
      "",
  };

  const styleSnapshot =
    feedbackEntry?.outfit_json || historyEntry?.outfit_json || {};

  return {
    wardrobeItemId:
      directContext?.wardrobeItemId ||
      feedbackEntry?.wardrobe_item_id ||
      feedbackEntry?.closet_item_id ||
      historyEntry?.wardrobe_item_id ||
      historyEntry?.closet_item_id ||
      null,
    subtype: normalizeToken(directContext?.subtype, null),
    primaryColor:
      normalizeToken(
        directContext?.primaryColor || feedbackEntry?.jacket_color,
        null
      ),
    secondaryColor: normalizeToken(
      directContext?.secondaryColor,
      null
    ),
    styleTags: normalizeStringArray(
      directContext?.styleTags || feedbackEntry?.style_tags
    ),
    warmthRating: toFiniteNumber(
      directContext?.warmthRating,
      null
    ),
    rainRating: toFiniteNumber(
      directContext?.rainRating,
      null
    ),
    windRating: toFiniteNumber(
      directContext?.windRating,
      null
    ),
    forecastWindow:
      normalizeToken(
        directContext?.forecastWindow ||
          historyEntry?.time_window ||
          weatherSnapshot.forecastWindow,
        "rest_of_day"
      ) || "rest_of_day",
    weatherContext:
      normalizeToken(
        directContext?.weatherContext ||
          weatherSnapshot.weatherContext,
        null
      ) || getWeatherContextFromConditions(fallbackConditions),
    temperatureBand:
      normalizeToken(
        directContext?.temperatureBand ||
          styleSnapshot.temperatureBand,
        null
      ) || getTemperatureBandFromConditions(fallbackConditions),
    recommendationBasis:
      normalizeToken(
        directContext?.recommendationBasis,
        "temperature"
      ) || "temperature",
    style: normalizeToken(
      directContext?.style || styleSnapshot.style,
      null
    ),
    colorStrategy: normalizeToken(
      directContext?.colorStrategy || styleSnapshot.colorStrategy,
      null
    ),
    styleWeatherState: normalizeToken(
      directContext?.styleWeatherState || styleSnapshot.weatherState,
      null
    ),
  };
}

export function getContextualJacketLearningScore({
  item,
  preferenceModel,
  weatherContext,
  forecastWindow,
}) {
  if (!item || !preferenceModel) {
    return 0;
  }

  const itemId = item.id || null;
  const subtype = normalizeToken(item.subtype || item.type, "other");
  const primaryColor = normalizeToken(
    item.primary_color || item.color,
    "other"
  );
  const secondaryColor = normalizeToken(item.secondary_color, null);
  const styleTags = normalizeStringArray(item.style_tags);
  const context = normalizeToken(weatherContext, "mild");
  const windowId = normalizeToken(forecastWindow, "rest_of_day");

  let score = 0;

  score +=
    (preferenceModel.contextItems?.[
      createLearningKey(context, itemId)
    ] || 0) * 1.35;

  score +=
    (preferenceModel.contextSubtypes?.[
      createLearningKey(context, subtype)
    ] || 0) * 0.75;

  score +=
    (preferenceModel.contextColors?.[
      createLearningKey(context, primaryColor)
    ] || 0) * 0.55;

  if (secondaryColor) {
    score +=
      (preferenceModel.contextSecondaryColors?.[
        createLearningKey(context, secondaryColor)
      ] || 0) * 0.25;
  }

  styleTags.forEach((tag) => {
    score +=
      (preferenceModel.contextStyleTags?.[
        createLearningKey(context, tag)
      ] || 0) * 0.2;
  });

  score +=
    (preferenceModel.windowItems?.[
      createLearningKey(windowId, itemId)
    ] || 0) * 0.45;

  score += (preferenceModel.subtypes?.[subtype] || 0) * 0.25;
  score += (preferenceModel.colors?.[primaryColor] || 0) * 0.2;

  return clampLearningScore(score, -8, 8);
}

export function getRecentRecommendationPenalty(
  itemId,
  preferenceModel
) {
  if (!itemId || !preferenceModel) {
    return 0;
  }

  const recentWeight = toFiniteNumber(
    preferenceModel.recentItems?.[itemId],
    0
  );

  const immediateRepeat =
    preferenceModel.lastRecommendedItemId === itemId ? 2 : 0;

  return clampLearningScore(
    recentWeight * 1.35 + immediateRepeat,
    0,
    6
  );
}

export function getStyleStrategyPreferenceScore({
  preferenceModel,
  style,
  strategy,
  weatherState,
  temperatureBand,
}) {
  if (!preferenceModel || !strategy) {
    return 0;
  }

  const normalizedStyle = normalizeToken(style, "streetwear");
  const normalizedStrategy = normalizeToken(strategy, null);
  const normalizedWeatherState = normalizeToken(
    weatherState,
    "default"
  );
  const normalizedTemperatureBand = normalizeToken(
    temperatureBand,
    "mild"
  );

  if (!normalizedStrategy) {
    return 0;
  }

  let score = 0;

  score +=
    (preferenceModel.styleStrategies?.[normalizedStrategy] || 0) *
    0.45;

  score +=
    (preferenceModel.styleStrategyByStyle?.[
      createLearningKey(normalizedStyle, normalizedStrategy)
    ] || 0) * 0.7;

  score +=
    (preferenceModel.styleStrategyByWeather?.[
      createLearningKey(normalizedWeatherState, normalizedStrategy)
    ] || 0) * 0.55;

  score +=
    (preferenceModel.styleStrategyByTemperature?.[
      createLearningKey(
        normalizedTemperatureBand,
        normalizedStrategy
      )
    ] || 0) * 0.35;

  return clampLearningScore(score, -5, 5);
}
