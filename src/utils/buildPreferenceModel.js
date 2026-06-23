import {
  createLearningKey,
  deriveFeedbackLearningContext,
  getFeedbackRecencyMultiplier,
  getFeedbackWeight,
} from "./feedbackLearning";

function addScore(record, key, amount) {
  if (!key || !Number.isFinite(amount) || amount === 0) {
    return;
  }

  record[key] = (record[key] || 0) + amount;
}

function normalizeSource(source, historyOverride = []) {
  if (Array.isArray(source)) {
    return {
      feedback: source,
      history: Array.isArray(historyOverride) ? historyOverride : [],
    };
  }

  return {
    feedback: Array.isArray(source?.feedback) ? source.feedback : [],
    history: Array.isArray(source?.history) ? source.history : [],
  };
}

function getEntryTimestamp(entry) {
  return entry?.updated_at || entry?.created_at || null;
}

function createHistoryMap(history) {
  return new Map(history.map((entry) => [entry.id, entry]));
}

function addAttributeScores(model, context, weightedScore) {
  addScore(model.items, context.wardrobeItemId, weightedScore);
  addScore(model.subtypes, context.subtype, weightedScore);
  addScore(model.colors, context.primaryColor, weightedScore);
  addScore(
    model.secondaryColors,
    context.secondaryColor,
    weightedScore
  );

  context.styleTags.forEach((tag) => {
    addScore(model.styleTags, tag, weightedScore);
  });

  if (context.warmthRating !== null) {
    addScore(
      model.warmthRatings,
      String(context.warmthRating),
      weightedScore
    );
  }

  if (context.rainRating !== null) {
    addScore(
      model.rainRatings,
      String(context.rainRating),
      weightedScore
    );
  }

  if (context.windRating !== null) {
    addScore(
      model.windRatings,
      String(context.windRating),
      weightedScore
    );
  }
}

function addContextScores(model, context, weightedScore) {
  const weatherContext = context.weatherContext || "mild";
  const forecastWindow = context.forecastWindow || "rest_of_day";

  addScore(
    model.contextItems,
    createLearningKey(weatherContext, context.wardrobeItemId),
    weightedScore
  );

  addScore(
    model.contextSubtypes,
    createLearningKey(weatherContext, context.subtype),
    weightedScore
  );

  addScore(
    model.contextColors,
    createLearningKey(weatherContext, context.primaryColor),
    weightedScore
  );

  addScore(
    model.contextSecondaryColors,
    createLearningKey(weatherContext, context.secondaryColor),
    weightedScore
  );

  context.styleTags.forEach((tag) => {
    addScore(
      model.contextStyleTags,
      createLearningKey(weatherContext, tag),
      weightedScore
    );
  });

  addScore(
    model.windowItems,
    createLearningKey(forecastWindow, context.wardrobeItemId),
    weightedScore
  );
}

function addStyleStrategyScores(model, context, weightedScore) {
  if (!context.colorStrategy) {
    return;
  }

  addScore(
    model.styleStrategies,
    context.colorStrategy,
    weightedScore
  );

  addScore(
    model.styleStrategyByStyle,
    createLearningKey(context.style, context.colorStrategy),
    weightedScore
  );

  addScore(
    model.styleStrategyByWeather,
    createLearningKey(
      context.styleWeatherState || context.weatherContext,
      context.colorStrategy
    ),
    weightedScore
  );

  addScore(
    model.styleStrategyByTemperature,
    createLearningKey(
      context.temperatureBand,
      context.colorStrategy
    ),
    weightedScore
  );
}

function addRecentHistory(model, history, ratedRecommendationIds) {
  const recentHistory = [...history]
    .filter((entry) => ratedRecommendationIds.has(entry.id))
    .sort((first, second) =>
      String(second.created_at || "").localeCompare(
        String(first.created_at || "")
      )
    )
    .slice(0, 12);

  recentHistory.forEach((entry, index) => {
    const itemId =
      entry?.wardrobe_item_id || entry?.closet_item_id || null;

    if (!itemId) {
      return;
    }

    const recencyWeight = Math.max(0.25, 1.6 - index * 0.12);
    addScore(model.recentItems, itemId, recencyWeight);

    if (index === 0) {
      model.lastRecommendedItemId = itemId;
    }
  });
}

export function buildPreferenceModel(source = [], historyOverride = []) {
  const { feedback, history } = normalizeSource(
    source,
    historyOverride
  );

  const model = {
    items: {},
    subtypes: {},
    colors: {},
    secondaryColors: {},
    styleTags: {},
    warmthRatings: {},
    rainRatings: {},
    windRatings: {},

    contextItems: {},
    contextSubtypes: {},
    contextColors: {},
    contextSecondaryColors: {},
    contextStyleTags: {},
    windowItems: {},

    styleStrategies: {},
    styleStrategyByStyle: {},
    styleStrategyByWeather: {},
    styleStrategyByTemperature: {},

    recentItems: {},
    lastRecommendedItemId: null,
    totalFeedback: feedback.length,
    totalHistory: history.length,
  };

  const historyMap = createHistoryMap(history);

  feedback.forEach((entry) => {
    const baseWeight = getFeedbackWeight(entry.rating);

    if (baseWeight === 0) {
      return;
    }

    const recencyMultiplier = getFeedbackRecencyMultiplier(
      getEntryTimestamp(entry)
    );

    const weightedScore = baseWeight * recencyMultiplier;
    const historyEntry = historyMap.get(entry.recommendation_id) || null;

    const context = deriveFeedbackLearningContext({
      feedbackEntry: entry,
      historyEntry,
    });

    addAttributeScores(model, context, weightedScore);
    addContextScores(model, context, weightedScore);
    addStyleStrategyScores(model, context, weightedScore);
  });

  addRecentHistory(
    model,
    history,
    new Set(feedback.map((entry) => entry.recommendation_id))
  );

  return model;
}

export function getItemPreferenceScore(item, preferenceModel) {
  if (!item || !preferenceModel) {
    return 0;
  }

  const itemId = item.id || null;
  const subtype = item.subtype || item.type || "other";
  const primaryColor = item.primary_color || item.color || "other";
  const secondaryColor = item.secondary_color || null;
  const styleTags = Array.isArray(item.style_tags)
    ? item.style_tags
    : [];

  let score = 0;

  score += preferenceModel.items?.[itemId] || 0;
  score += (preferenceModel.subtypes?.[subtype] || 0) * 0.35;
  score += (preferenceModel.colors?.[primaryColor] || 0) * 0.3;

  if (secondaryColor) {
    score +=
      (preferenceModel.secondaryColors?.[secondaryColor] || 0) *
      0.15;
  }

  styleTags.forEach((tag) => {
    score += (preferenceModel.styleTags?.[tag] || 0) * 0.15;
  });

  return Math.max(-10, Math.min(10, score));
}
