import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";
import { VISUAL_INTELLIGENCE_CONFIG } from "../config/visualIntelligenceConfig.js";

function toFiniteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(toFiniteNumber(value, 0) * factor) / factor;
}

function formatLocation(location, weather) {
  return {
    name:
      location?.name ||
      weather?.city ||
      weather?.location?.name ||
      "Unknown",
    region:
      location?.region ||
      weather?.region ||
      weather?.location?.region ||
      "",
    country:
      location?.country ||
      weather?.country ||
      weather?.location?.country ||
      "",
    source:
      location?.source === "browser" ? "browser" : "search",
  };
}

function getProfileSummary(profile) {
  if (!profile) {
    return {
      available: false,
      coldTolerance: null,
      rainSensitivity: null,
      windSensitivity: null,
      defaultExposure: null,
      stylePreference: null,
      preferredColor: null,
    };
  }

  return {
    available: true,
    coldTolerance: profile.cold_tolerance || null,
    rainSensitivity: profile.rain_sensitivity || null,
    windSensitivity: profile.wind_sensitivity || null,
    defaultExposure: profile.default_exposure || null,
    stylePreference: profile.style_preference || null,
    preferredColor: profile.preferred_color || null,
  };
}

function getJacketReferenceMap(closetItems) {
  const map = new Map();
  let nextIndex = 1;

  closetItems.forEach((item) => {
    if (!item?.id || map.has(item.id)) {
      return;
    }

    map.set(item.id, `jacket-${nextIndex}`);
    nextIndex += 1;
  });

  return map;
}

function sanitizeJacket(item, referenceMap) {
  if (!item) {
    return null;
  }

  return {
    reference:
      referenceMap.get(item.id) ||
      `jacket-${String(item.name || "unknown")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,
    name: item.name || "Unnamed jacket",
    category: item.category || null,
    subtype: item.subtype || item.type || null,
    primaryColor: item.primary_color || item.color || null,
    secondaryColor: item.secondary_color || null,
    warmthRating: toFiniteNumber(item.warmth_rating, null),
    rainRating: toFiniteNumber(item.rain_rating, null),
    windRating: toFiniteNumber(item.wind_rating, null),
    favorite: item.favorite === true,
    archived: item.archived === true,
    styleTags: Array.isArray(item.style_tags)
      ? item.style_tags
      : [],
    visualIntelligence: {
      status: item.embedding?.status || "missing",
      provider: item.embedding?.provider || null,
      model: item.embedding?.model || null,
      dimensions: item.embedding?.dimensions || null,
      generatedAt: item.embedding?.generated_at || null,
      updatedAt: item.embedding?.updated_at || null,
      sourceHashPresent: Boolean(item.embedding?.source_hash),
      error: item.embedding?.error_message || null,
    },
  };
}

function getMissingProfileFields(profile) {
  if (!profile) {
    return ["profile"];
  }

  const fields = [
    ["cold_tolerance", profile.cold_tolerance],
    ["rain_sensitivity", profile.rain_sensitivity],
    ["wind_sensitivity", profile.wind_sensitivity],
    ["default_exposure", profile.default_exposure],
    ["style_preference", profile.style_preference],
  ];

  return fields
    .filter(([, value]) => value === null || value === undefined || value === "")
    .map(([key]) => key);
}

function hasIncompleteJacketMetadata(match) {
  const item = match?.item;

  if (!item) {
    return false;
  }

  return [
    item.warmth_rating,
    item.rain_rating,
    item.wind_rating,
  ].some(
    (value) =>
      value === null || value === undefined || value === ""
  );
}

function buildConfidence({
  recommendation,
  profile,
  ranking,
}) {
  const config = RECOMMENDATION_CONFIG.confidence;
  const penalties = config.penalties;
  const reasons = [];
  let score = 100;

  const forecastAnalysis = recommendation?.forecastAnalysis || {};
  const selectedConditions =
    forecastAnalysis.selectedConditions ||
    recommendation?.selectedConditions ||
    {};

  if (forecastAnalysis.coverageLevel === "missing") {
    score -= penalties.missingForecastCoverage;
    reasons.push("The selected window is missing hourly forecast coverage.");
  } else if (forecastAnalysis.coverageLevel === "partial") {
    score -= penalties.partialForecastCoverage;
    reasons.push("Only part of the selected forecast window is available.");
  }

  const decisionDistance = Math.abs(
    toFiniteNumber(recommendation?.score, 0) -
      RECOMMENDATION_CONFIG.decision.yesMinimumScore
  );

  if (decisionDistance <= 1) {
    score -= penalties.thresholdDistanceOneOrLess;
    reasons.push("The weather score is very close to the YES/NO boundary.");
  } else if (decisionDistance <= 2) {
    score -= penalties.thresholdDistanceTwoOrLess;
    reasons.push("The weather score is fairly close to the YES/NO boundary.");
  }

  const feelsLikeRange =
    toFiniteNumber(selectedConditions.highestFeelsLike, 0) -
    toFiniteNumber(selectedConditions.lowestFeelsLike, 0);

  if (feelsLikeRange >= config.changingFeelsLikeRange) {
    score -= penalties.changingConditions;
    reasons.push("Conditions vary significantly during the selected window.");
  }

  const missingProfileFields = getMissingProfileFields(profile);

  if (missingProfileFields.length > 0) {
    score -= penalties.missingProfile;
    reasons.push("Some profile inputs are missing, so personalization is limited.");
  }

  if (
    recommendation?.decision === "YES" &&
    !recommendation?.closetMatch?.item
  ) {
    score -= penalties.missingJacketForYes;
    reasons.push("A jacket is recommended, but no eligible owned jacket is available.");
  }

  const suitableMatches = (ranking?.rankedItems || []).filter(
    (match) => match.safetyAssessment?.level === "suitable"
  );

  if (
    recommendation?.decision === "YES" &&
    suitableMatches.length === 1
  ) {
    score -= penalties.onlyOneSuitableJacket;
    reasons.push("Only one owned jacket is a strong weather match.");
  }

  const firstScore = toFiniteNumber(
    ranking?.rankedItems?.[0]?.score,
    null
  );
  const secondScore = toFiniteNumber(
    ranking?.rankedItems?.[1]?.score,
    null
  );

  if (
    firstScore !== null &&
    secondScore !== null &&
    Math.abs(firstScore - secondScore) < config.closeTopJacketGap
  ) {
    score -= penalties.closeTopJackets;
    reasons.push("The top two jackets are nearly tied.");
  }

  if (hasIncompleteJacketMetadata(ranking?.rankedItems?.[0])) {
    score -= penalties.incompleteJacketMetadata;
    reasons.push("The leading jacket is missing some protection metadata.");
  }

  score = Math.max(0, Math.min(100, score));

  let level = "Low";

  if (score >= config.highMinimum) {
    level = "High";
  } else if (score >= config.mediumMinimum) {
    level = "Medium";
  }

  if (reasons.length === 0) {
    reasons.push("Forecast, profile, and jacket data strongly agree.");
  }

  return {
    level,
    score,
    reasons,
    decisionDistance,
    topJacketGap:
      firstScore !== null && secondScore !== null
        ? round(Math.abs(firstScore - secondScore))
        : null,
    suitableJacketCount: suitableMatches.length,
    missingProfileFields,
  };
}

function buildRankingEntry(match, index, referenceMap) {
  const similarityAdjustment = match.similarityDiversityAdjustment
    ? {
        applied: true,
        penalty: round(match.similarityDiversityAdjustment.penalty),
        similarity: round(match.similarityDiversityAdjustment.similarity, 4),
        similarToReference:
          referenceMap.get(
            match.similarityDiversityAdjustment.similarToItemId
          ) || null,
        reason: match.similarityDiversityAdjustment.reason || null,
      }
    : null;

  return {
    rank: index + 1,
    jacket: sanitizeJacket(match.item, referenceMap),
    rawFinalScore: round(match.score),
    rankingScore: round(match.rankingScore ?? match.score),
    similarityDiversityAdjustment: similarityAdjustment,
    safety: {
      level: match.safetyAssessment?.level || "unknown",
      rank: match.safetyAssessment?.rank ?? null,
      deficiencies:
        match.safetyAssessment?.deficiencies || [],
    },
    breakdown: {
      warmth: round(match.warmthScore),
      rain: round(match.rainScore),
      wind: round(match.windScore),
      protectionSubtotal: round(match.protectionScore),
      profileStyle: round(match.profileStyleScore),
      favorite: round(match.favoriteBonus),
      storedPreference: round(match.storedPreferenceScore),
      contextualLearning: round(match.contextualLearningScore),
      exploration: round(match.explorationBonus),
      recentUsePenalty: round(match.recentRecommendationPenalty),
      overkillPenalty: round(match.overkillPenalty),
      protectionDeficitPenalty: round(
        match.protectionDeficitPenalty
      ),
      similarityDiversityPenalty: round(
        match.similarityDiversityPenalty
      ),
      diversityAdjustedFinal: round(
        match.rankingScore ?? match.score
      ),
    },
    reasons: Array.isArray(match.reasons) ? match.reasons : [],
  };
}

function buildVisualIntelligenceSummary({
  closetItems,
  ranking,
  referenceMap,
}) {
  const jackets = closetItems.filter((item) => item?.category === "jacket");
  const statusCounts = {
    ready: 0,
    missing: 0,
    pending: 0,
    processing: 0,
    stale: 0,
    failed: 0,
  };
  const providers = new Set();
  const models = new Set();
  const matches = [];
  const seenPairs = new Set();

  jackets.forEach((item) => {
    const status = item.embedding?.status || "missing";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (item.embedding?.provider) {
      providers.add(item.embedding.provider);
    }

    if (item.embedding?.model) {
      models.add(item.embedding.model);
    }

    (Array.isArray(item.similarity_matches)
      ? item.similarity_matches
      : []
    ).forEach((match) => {
      if (!match?.jacketId) {
        return;
      }

      const sourceReference = referenceMap.get(item.id);
      const targetReference = referenceMap.get(match.jacketId);
      if (!sourceReference || !targetReference) {
        return;
      }

      const pairKey = [sourceReference, targetReference].sort().join("|");
      if (seenPairs.has(pairKey)) {
        return;
      }

      seenPairs.add(pairKey);
      matches.push({
        sourceReference,
        targetReference,
        similarity: round(match.similarity, 4),
        category: match.category || null,
        provider: match.provider || null,
        model: match.model || null,
      });
    });
  });

  const adjusted = (ranking?.rankedItems || []).filter(
    (match) => match.similarityDiversityPenalty > 0
  );

  return {
    enabled: true,
    configuredDimensions: 768,
    thresholds: {
      minimumSimilarity:
        VISUAL_INTELLIGENCE_CONFIG.matching.minimumSimilarity,
      stronglySimilar:
        VISUAL_INTELLIGENCE_CONFIG.matching.stronglySimilarMinimum,
      veryLikelyDuplicate:
        VISUAL_INTELLIGENCE_CONFIG.matching.veryLikelyDuplicateMinimum,
      recommendationNearDuplicate:
        VISUAL_INTELLIGENCE_CONFIG.recommendation
          .duplicateAlternativeSimilarity,
      recommendationPenalty:
        VISUAL_INTELLIGENCE_CONFIG.recommendation.nearDuplicatePenalty,
    },
    jacketCount: jackets.length,
    statusCounts,
    providers: [...providers],
    models: [...models],
    similarityPairCount: matches.length,
    similarityPairs: matches.slice(0, 50),
    rankingAdjustmentCount: adjusted.length,
    affectedTopThree: adjusted
      .slice(0, 3)
      .some((match) => match.similarityDiversityPenalty > 0),
    adjustedJackets: adjusted.map((match) => ({
      reference: referenceMap.get(match.item?.id) || null,
      penalty: round(match.similarityDiversityPenalty),
      similarity: round(
        match.similarityDiversityAdjustment?.similarity,
        4
      ),
      similarToReference:
        referenceMap.get(
          match.similarityDiversityAdjustment?.similarToItemId
        ) || null,
    })),
  };
}

function buildExcludedEntry(entry, referenceMap) {
  return {
    jacket: sanitizeJacket(entry.item, referenceMap),
    reasonCode: entry.code,
    reason: entry.label,
  };
}

export function buildRecommendationDiagnostics({
  recommendation,
  weather,
  profile,
  windowId = "rest_of_day",
  location = null,
  closetItems = [],
  ranking = null,
}) {
  const safeClosetItems = Array.isArray(closetItems)
    ? closetItems
    : [];
  const referenceMap = getJacketReferenceMap(safeClosetItems);
  const activeRanking = ranking || {
    rankedItems:
      recommendation?.allRankedClosetMatches || [],
    excludedItems: [],
    weatherNeeds: recommendation?.weatherNeeds || null,
  };

  const selectedConditions =
    recommendation?.selectedConditions ||
    recommendation?.forecastAnalysis?.selectedConditions ||
    {};

  const confidence = buildConfidence({
    recommendation,
    profile,
    ranking: activeRanking,
  });

  const selectedJacket = recommendation?.closetMatch?.item
    ? sanitizeJacket(
        recommendation.closetMatch.item,
        referenceMap
      )
    : null;

  return {
    schemaVersion: "phase10-v1",
    engineVersion: RECOMMENDATION_CONFIG.version,
    generatedAt: new Date().toISOString(),

    request: {
      location: formatLocation(location, weather),
      forecastWindow: windowId,
      forecastWindowLabel:
        recommendation?.forecastAnalysis?.windowLabel ||
        windowId,
      selectedHourCount:
        recommendation?.forecastAnalysis?.windowHours?.length ||
        selectedConditions.hourCount ||
        0,
      profile: getProfileSummary(profile),
      closetItemCount: safeClosetItems.length,
    },

    weather: {
      condition: selectedConditions.condition || "Unknown",
      temperature: round(
        selectedConditions.temperature,
        1
      ),
      feelsLike: round(selectedConditions.feelsLike, 1),
      lowestFeelsLike: round(
        selectedConditions.lowestFeelsLike,
        1
      ),
      highestFeelsLike: round(
        selectedConditions.highestFeelsLike,
        1
      ),
      rainChance: round(selectedConditions.rainChance, 1),
      windSpeed: round(selectedConditions.windSpeed, 1),
      temperatureDrop: round(
        recommendation?.forecastAnalysis?.tempDrop,
        1
      ),
      forecastCoverage:
        recommendation?.forecastAnalysis?.coverageLevel ||
        "unknown",
      alerts:
        recommendation?.forecastAnalysis?.alerts || [],
    },

    decision: {
      result: recommendation?.decision || null,
      recommendationBasis:
        recommendation?.recommendationBasis || null,
      yesMinimumScore:
        RECOMMENDATION_CONFIG.decision.yesMinimumScore,
      baseWeatherScore: round(recommendation?.baseScore),
      profileModifier: round(
        recommendation?.profileModifier
      ),
      finalWeatherScore: round(recommendation?.score),
      scoreBreakdown:
        recommendation?.weatherScoreBreakdown || null,
      profileModifierBreakdown:
        recommendation?.profileModifierBreakdown || [],
      confidence,
      reasons: recommendation?.reasons || [],
    },

    overrides: {
      applied:
        recommendation?.protectionOverride?.applied === true,
      rainRequired:
        recommendation?.protectionOverride?.rainRequired === true,
      windRequired:
        recommendation?.protectionOverride?.windRequired === true,
      winterPrecipitation:
        recommendation?.protectionOverride
          ?.winterPrecipitation === true,
      originalDecision:
        recommendation?.protectionOverride?.originalDecision ||
        recommendation?.decision ||
        null,
      finalDecision: recommendation?.decision || null,
      reason:
        recommendation?.protectionOverride?.reason || null,
    },

    weatherNeeds: activeRanking.weatherNeeds
      ? {
          warmth: activeRanking.weatherNeeds.warmthNeeded,
          rain: activeRanking.weatherNeeds.rainNeeded,
          wind: activeRanking.weatherNeeds.windNeeded,
          effectiveFeelsLike: round(
            activeRanking.weatherNeeds.effectiveFeelsLike,
            1
          ),
          context: activeRanking.weatherNeeds.weatherContext,
        }
      : null,

    jacketRanking: {
      selectedJacket,
      eligibleCount:
        activeRanking.rankedItems?.length || 0,
      excludedCount:
        activeRanking.excludedItems?.length || 0,
      ranked: (activeRanking.rankedItems || []).map(
        (match, index) =>
          buildRankingEntry(match, index, referenceMap)
      ),
      excluded: (activeRanking.excludedItems || []).map(
        (entry) => buildExcludedEntry(entry, referenceMap)
      ),
    },

    visualIntelligence: buildVisualIntelligenceSummary({
      closetItems: safeClosetItems,
      ranking: activeRanking,
      referenceMap,
    }),

    styleSuggestion: recommendation?.styleSuggestion
      ? {
          text:
            recommendation.styleSuggestion.summary ||
            recommendation.styleSuggestion.text ||
            recommendation.styleSuggestion.suggestion ||
            null,
          style:
            recommendation.styleSuggestion.style || null,
          colorStrategy:
            recommendation.styleSuggestion.colorStrategy || null,
          weatherState:
            recommendation.styleSuggestion.weatherState || null,
          temperatureBand:
            recommendation.styleSuggestion.temperatureBand || null,
          variationKey:
            recommendation.styleSuggestion.variantKey ||
            recommendation.styleSuggestion.variationKey ||
            null,
        }
      : null,
  };
}

export function buildSanitizedDiagnosticJson(diagnostics) {
  return JSON.stringify(diagnostics, null, 2);
}
