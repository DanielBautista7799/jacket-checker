import { RECOMMENDATION_CONFIG } from "../config/recommendationConfig.js";
import { VISUAL_INTELLIGENCE_CONFIG } from "../config/visualIntelligenceConfig.js";
import {
  getContextualJacketLearningScore,
  getRecentRecommendationPenalty,
  getWeatherContextFromConditions,
} from "./feedbackLearning.js";

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function getSelectedConditions(weather, forecastAnalysis) {
  const selected = forecastAnalysis?.selectedConditions || {};

  const feelsLike = toFiniteNumber(
    selected.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
  );

  return {
    feelsLike,
    lowestFeelsLike: toFiniteNumber(
      selected.lowestFeelsLike,
      toFiniteNumber(
        forecastAnalysis?.lowestWindowFeelsLike,
        feelsLike
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
  };
}

function getItemPrimaryColor(item) {
  return item?.primary_color || item?.color || null;
}

function getStoredPreferenceScore(item) {
  return toFiniteNumber(
    item?.preference_score ?? item?.times_recommended,
    0
  );
}

function getExclusionReason(item, excludedSet) {
  if (!item || typeof item !== "object") {
    return {
      code: "invalid_item",
      label: "Invalid jacket record",
    };
  }

  if (item.category !== "jacket") {
    return {
      code: "non_jacket",
      label: "Only jackets are eligible for ranking",
    };
  }

  if (item.archived === true) {
    return {
      code: "archived",
      label: "Archived jackets are excluded",
    };
  }

  if (excludedSet.has(item.id)) {
    return {
      code: "feedback_excluded",
      label: "Excluded from this check after Not It feedback",
    };
  }

  return null;
}

export function getWeatherNeeds(weather, forecastAnalysis) {
  const selectedConditions = getSelectedConditions(
    weather,
    forecastAnalysis
  );

  const effectiveFeelsLike = Math.min(
    selectedConditions.feelsLike,
    selectedConditions.lowestFeelsLike + 3
  );

  let warmthNeeded = 1;

  for (const band of RECOMMENDATION_CONFIG.weatherNeeds.warmth) {
    if (effectiveFeelsLike < band.feelsLikeBelow) {
      warmthNeeded = band.rating;
      break;
    }
  }

  const precipitationCondition = includesAny(
    selectedConditions.condition,
    RECOMMENDATION_CONFIG.protectionOverride.precipitationTerms
  );

  let rainNeeded = 1;

  for (const band of RECOMMENDATION_CONFIG.weatherNeeds.rain) {
    if (selectedConditions.rainChance >= band.chanceAtLeast) {
      rainNeeded = band.rating;
      break;
    }
  }

  if (precipitationCondition) {
    rainNeeded = Math.max(
      rainNeeded,
      RECOMMENDATION_CONFIG.weatherNeeds
        .precipitationConditionMinimum
    );
  }

  let windNeeded = 1;

  for (const band of RECOMMENDATION_CONFIG.weatherNeeds.wind) {
    if (selectedConditions.windSpeed >= band.speedAtLeast) {
      windNeeded = band.rating;
      break;
    }
  }

  return {
    warmthNeeded,
    rainNeeded,
    windNeeded,
    selectedConditions,
    effectiveFeelsLike,
    weatherContext: getWeatherContextFromConditions(
      selectedConditions
    ),
  };
}

function scoreRatingMatch(itemRating, neededRating) {
  const scores =
    RECOMMENDATION_CONFIG.ranking.ratingMatchScores;
  const rating = toFiniteNumber(itemRating, 1);
  const difference = rating - neededRating;

  if (difference === 0) {
    return scores.exact;
  }

  if (difference === 1) {
    return scores.oneAbove;
  }

  if (difference === -1) {
    return scores.oneBelow;
  }

  if (difference === 2) {
    return scores.twoAbove;
  }

  if (difference === -2) {
    return scores.twoBelow;
  }

  if (difference >= 3) {
    return scores.threeOrMoreAbove;
  }

  return scores.threeOrMoreBelow;
}

function getProtectionWeights(needs) {
  const weights =
    RECOMMENDATION_CONFIG.ranking.protectionWeights;

  return {
    warmth: weights.required,
    rain:
      needs.rainNeeded >= 3
        ? weights.required
        : needs.rainNeeded === 2
          ? weights.useful
          : weights.unnecessary,
    wind:
      needs.windNeeded >= 3
        ? weights.required
        : needs.windNeeded === 2
          ? weights.useful
          : weights.unnecessary,
  };
}

function getOverkillPenalty(item, needs) {
  const config = RECOMMENDATION_CONFIG.ranking.overkill;
  let penalty = 0;

  const warmthDifference =
    toFiniteNumber(item.warmth_rating, 1) -
    needs.warmthNeeded;

  const rainDifference =
    toFiniteNumber(item.rain_rating, 1) - needs.rainNeeded;

  const windDifference =
    toFiniteNumber(item.wind_rating, 1) - needs.windNeeded;

  if (warmthDifference >= 3) {
    penalty += config.warmthDifferenceThree;
  } else if (warmthDifference === 2) {
    penalty += config.warmthDifferenceTwo;
  }

  if (needs.rainNeeded <= 2 && rainDifference >= 3) {
    penalty += config.dryRainDifferenceThree;
  }

  if (needs.windNeeded <= 2 && windDifference >= 3) {
    penalty += config.calmWindDifferenceThree;
  }

  return penalty;
}

function getProtectionDeficitPenalty(item, needs) {
  const config = RECOMMENDATION_CONFIG.ranking.deficit;
  let penalty = 0;

  const warmthRating = toFiniteNumber(item.warmth_rating, 1);
  const rainRating = toFiniteNumber(item.rain_rating, 1);
  const windRating = toFiniteNumber(item.wind_rating, 1);

  if (needs.warmthNeeded >= 4 && warmthRating <= 2) {
    penalty +=
      warmthRating === 1
        ? config.severeWarmthRatingOne
        : config.severeWarmthRatingTwo;
  }

  if (needs.rainNeeded >= 4) {
    if (rainRating <= 1) {
      penalty += config.severeRainRatingOne;
    } else if (rainRating === 2) {
      penalty += config.severeRainRatingTwo;
    }
  }

  if (needs.windNeeded >= 4) {
    if (windRating <= 1) {
      penalty += config.severeWindRatingOne;
    } else if (windRating === 2) {
      penalty += config.severeWindRatingTwo;
    }
  }

  return penalty;
}

function getSafetyAssessment(item, needs) {
  const warmthRating = toFiniteNumber(item.warmth_rating, 1);
  const rainRating = toFiniteNumber(item.rain_rating, 1);
  const windRating = toFiniteNumber(item.wind_rating, 1);
  const deficiencies = [];
  let severeDeficiency = false;

  if (needs.warmthNeeded >= 4 && warmthRating <= 2) {
    deficiencies.push("warmth");
    severeDeficiency ||= warmthRating <= 1;
  }

  if (needs.rainNeeded >= 4 && rainRating <= 2) {
    deficiencies.push("rain");
    severeDeficiency ||= rainRating <= 1;
  }

  if (needs.windNeeded >= 4 && windRating <= 2) {
    deficiencies.push("wind");
    severeDeficiency ||= windRating <= 1;
  }

  if (severeDeficiency) {
    return {
      level: "poor",
      rank: RECOMMENDATION_CONFIG.ranking.safety.poorRank,
      deficiencies,
    };
  }

  if (deficiencies.length > 0) {
    return {
      level: "limited",
      rank: RECOMMENDATION_CONFIG.ranking.safety.limitedRank,
      deficiencies,
    };
  }

  return {
    level: "suitable",
    rank: RECOMMENDATION_CONFIG.ranking.safety.suitableRank,
    deficiencies,
  };
}

function getProfileStyleScore(item, profile) {
  let score = 0;

  const profileStyle = profile?.style_preference;
  const preferredColor = profile?.preferred_color;
  const itemColor = getItemPrimaryColor(item);

  if (
    profileStyle &&
    Array.isArray(item.style_tags) &&
    item.style_tags.includes(profileStyle)
  ) {
    score += RECOMMENDATION_CONFIG.ranking.styleTagMatch;
  }

  if (preferredColor && itemColor === preferredColor) {
    score +=
      RECOMMENDATION_CONFIG.ranking.preferredColorMatch;
  }

  return score;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getTieBreakValue(item, weather, forecastAnalysis) {
  const date = String(weather?.localTime || "").split(" ")[0];

  const seed = [
    weather?.city || "unknown",
    forecastAnalysis?.windowId || "rest_of_day",
    date || "unknown-date",
    item.id || item.name || "item",
  ].join("|");

  return hashString(seed);
}

function getStoredSimilarity(item, targetItemId) {
  const matches = Array.isArray(item?.similarity_matches)
    ? item.similarity_matches
    : [];

  const match = matches.find(
    (entry) => entry?.jacketId === targetItemId
  );

  return toFiniteNumber(match?.similarity, 0);
}

function getMaximumSelectedSimilarity(item, selectedMatches) {
  let maximum = 0;
  let closestItemId = null;

  selectedMatches.forEach((selectedMatch) => {
    const forward = getStoredSimilarity(
      item,
      selectedMatch.item.id
    );
    const reverse = getStoredSimilarity(
      selectedMatch.item,
      item.id
    );
    const similarity = Math.max(forward, reverse);

    if (similarity > maximum) {
      maximum = similarity;
      closestItemId = selectedMatch.item.id;
    }
  });

  return {
    similarity: maximum,
    closestItemId,
  };
}

function diversifyRankedItems(baseRankedItems) {
  if (baseRankedItems.length <= 1) {
    return baseRankedItems.map((match) => ({
      ...match,
      similarityDiversityPenalty: 0,
      similarityDiversityAdjustment: null,
      rankingScore: match.score,
    }));
  }

  const remaining = [...baseRankedItems];
  const diversified = [];
  const threshold =
    VISUAL_INTELLIGENCE_CONFIG.recommendation
      .duplicateAlternativeSimilarity;
  const configuredPenalty =
    VISUAL_INTELLIGENCE_CONFIG.recommendation
      .nearDuplicatePenalty;

  while (remaining.length > 0) {
    const candidates = remaining
      .map((match) => {
        const closest = getMaximumSelectedSimilarity(
          match.item,
          diversified
        );

        const closestSelected = diversified.find(
          (selected) =>
            selected.item.id === closest.closestItemId
        );

        const sameSafetyLevel =
          !closestSelected ||
          closestSelected.safetyAssessment.rank ===
            match.safetyAssessment.rank;

        const penalty =
          sameSafetyLevel && closest.similarity >= threshold
            ? configuredPenalty
            : 0;

        return {
          match,
          penalty,
          closest,
          rankingScore: match.score - penalty,
        };
      })
      .sort((first, second) => {
        if (
          second.match.safetyAssessment.rank !==
          first.match.safetyAssessment.rank
        ) {
          return (
            second.match.safetyAssessment.rank -
            first.match.safetyAssessment.rank
          );
        }

        if (second.rankingScore !== first.rankingScore) {
          return second.rankingScore - first.rankingScore;
        }

        return (
          second.match.tieBreakValue -
          first.match.tieBreakValue
        );
      });

    const selected = candidates[0];
    const index = remaining.findIndex(
      (match) => match.item.id === selected.match.item.id
    );

    remaining.splice(index, 1);

    const adjustment =
      selected.penalty > 0
        ? {
            applied: true,
            penalty: selected.penalty,
            similarity: selected.closest.similarity,
            similarToItemId:
              selected.closest.closestItemId,
            reason:
              "A near-duplicate alternative was moved down to keep the top choices meaningfully different.",
          }
        : null;

    diversified.push({
      ...selected.match,
      similarityDiversityPenalty: selected.penalty,
      similarityDiversityAdjustment: adjustment,
      rankingScore: selected.rankingScore,
      scoreBreakdown: {
        ...selected.match.scoreBreakdown,
        similarityDiversityPenalty: selected.penalty,
        diversityAdjustedFinal: selected.rankingScore,
      },
      reasons: adjustment
        ? [...selected.match.reasons, adjustment.reason]
        : selected.match.reasons,
    });
  }

  return diversified;
}

function getExplorationBonus({
  item,
  weather,
  forecastAnalysis,
  preferenceModel,
  recentRecommendationPenalty,
}) {
  const rankingConfig = RECOMMENDATION_CONFIG.ranking;

  if (
    !preferenceModel ||
    preferenceModel.totalFeedback <
      rankingConfig.minimumFeedbackForExploration ||
    recentRecommendationPenalty >=
      rankingConfig.recentPenaltyBlocksExplorationAt
  ) {
    return 0;
  }

  const seed = [
    "explore",
    weather?.city || "unknown",
    forecastAnalysis?.windowId || "rest_of_day",
    String(weather?.localTime || "").split(" ")[0] || "date",
    item.id || item.name || "item",
  ].join("|");

  return (
    hashString(seed) %
    (rankingConfig.explorationMaximum + 1)
  );
}

function getProtectionReason(label, itemRating, neededRating) {
  const rating = toFiniteNumber(itemRating, 1);
  const difference = rating - neededRating;
  const lowerLabel = label.toLowerCase();

  if (difference === 0 || difference === 1) {
    return `Its ${lowerLabel} is a strong match for this forecast.`;
  }

  if (difference < 0) {
    return `Its ${lowerLabel} may be lighter than ideal for this forecast.`;
  }

  return `Its ${lowerLabel} provides more protection than the forecast requires.`;
}

function buildReasons({
  item,
  weatherNeeds,
  profileStyleScore,
  storedPreferenceScore,
  contextualLearningScore,
  recentRecommendationPenalty,
  overkillPenalty,
  protectionDeficitPenalty,
  favoriteBonus,
  safetyAssessment,
}) {
  const reasons = [
    getProtectionReason(
      "warmth",
      item.warmth_rating,
      weatherNeeds.warmthNeeded
    ),
  ];

  if (weatherNeeds.rainNeeded >= 3) {
    reasons.push(
      getProtectionReason(
        "rain protection",
        item.rain_rating,
        weatherNeeds.rainNeeded
      )
    );
  }

  if (weatherNeeds.windNeeded >= 3) {
    reasons.push(
      getProtectionReason(
        "wind protection",
        item.wind_rating,
        weatherNeeds.windNeeded
      )
    );
  }

  if (safetyAssessment.level !== "suitable") {
    reasons.push(
      `Its ${safetyAssessment.deficiencies.join(
        ", "
      )} protection is below the strongest requirement for this forecast.`
    );
  }

  if (profileStyleScore > 0) {
    reasons.push("It matches your saved style preferences.");
  }

  if (favoriteBonus > 0) {
    reasons.push("You marked this jacket as a favorite.");
  }

  if (storedPreferenceScore > 0) {
    reasons.push("Your overall feedback favors this jacket.");
  }

  if (storedPreferenceScore < 0) {
    reasons.push("Your overall feedback lowers this jacket.");
  }

  if (contextualLearningScore >= 1.5) {
    reasons.push(
      "Your feedback in similar weather favors this jacket."
    );
  }

  if (contextualLearningScore <= -1.5) {
    reasons.push(
      "Your feedback in similar weather lowers this match."
    );
  }

  if (recentRecommendationPenalty >= 2) {
    reasons.push(
      "It was recommended recently, so close alternatives get a chance to rotate in."
    );
  }

  if (overkillPenalty > 0) {
    reasons.push(
      "It may offer more protection than this forecast needs."
    );
  }

  if (protectionDeficitPenalty > 0) {
    reasons.push(
      "Its weather protection is weaker than the selected forecast calls for."
    );
  }

  return reasons;
}

export function rankClosetItems({
  closetItems = [],
  weather,
  forecastAnalysis,
  profile,
  preferenceModel = null,
  excludedItemIds = [],
}) {
  const weatherNeeds = getWeatherNeeds(
    weather,
    forecastAnalysis
  );

  const excludedSet = new Set(excludedItemIds);
  const protectionWeights = getProtectionWeights(weatherNeeds);
  const forecastWindow =
    forecastAnalysis?.windowId || "rest_of_day";
  const excludedItems = [];
  const eligibleItems = [];

  closetItems.forEach((item) => {
    const exclusion = getExclusionReason(item, excludedSet);

    if (exclusion) {
      excludedItems.push({
        item: item || null,
        ...exclusion,
      });
      return;
    }

    eligibleItems.push(item);
  });

  const baseRankedItems = eligibleItems
    .map((item) => {
      const rawWarmthScore = scoreRatingMatch(
        item.warmth_rating,
        weatherNeeds.warmthNeeded
      );

      const rawRainScore = scoreRatingMatch(
        item.rain_rating,
        weatherNeeds.rainNeeded
      );

      const rawWindScore = scoreRatingMatch(
        item.wind_rating,
        weatherNeeds.windNeeded
      );

      const warmthScore =
        rawWarmthScore * protectionWeights.warmth;
      const rainScore =
        rawRainScore * protectionWeights.rain;
      const windScore =
        rawWindScore * protectionWeights.wind;

      const profileStyleScore = getProfileStyleScore(
        item,
        profile
      );

      const favoriteBonus = item.favorite
        ? RECOMMENDATION_CONFIG.ranking.favoriteBonus
        : 0;

      const rawStoredPreferenceScore =
        getStoredPreferenceScore(item);

      const storedPreferenceScore = clamp(
        rawStoredPreferenceScore,
        RECOMMENDATION_CONFIG.ranking
          .storedPreferenceMinimum,
        RECOMMENDATION_CONFIG.ranking
          .storedPreferenceMaximum
      );

      const contextualLearningScore =
        getContextualJacketLearningScore({
          item,
          preferenceModel,
          weatherContext: weatherNeeds.weatherContext,
          forecastWindow,
        });

      const recentRecommendationPenalty =
        getRecentRecommendationPenalty(
          item.id,
          preferenceModel
        );

      const overkillPenalty = getOverkillPenalty(
        item,
        weatherNeeds
      );

      const protectionDeficitPenalty =
        getProtectionDeficitPenalty(item, weatherNeeds);

      const safetyAssessment = getSafetyAssessment(
        item,
        weatherNeeds
      );

      const explorationBonus = getExplorationBonus({
        item,
        weather,
        forecastAnalysis,
        preferenceModel,
        recentRecommendationPenalty,
      });

      const protectionScore =
        warmthScore +
        rainScore +
        windScore -
        overkillPenalty -
        protectionDeficitPenalty;

      const score =
        protectionScore +
        profileStyleScore +
        favoriteBonus +
        storedPreferenceScore +
        contextualLearningScore +
        explorationBonus -
        recentRecommendationPenalty;

      return {
        item,
        score,
        protectionScore,
        warmthScore,
        rainScore,
        windScore,
        rawWarmthScore,
        rawRainScore,
        rawWindScore,
        profileStyleScore,
        favoriteBonus,
        preferenceScore: rawStoredPreferenceScore,
        storedPreferenceScore,
        contextualLearningScore,
        recentRecommendationPenalty,
        explorationBonus,
        overkillPenalty,
        protectionDeficitPenalty,
        safetyAssessment,
        tieBreakValue: getTieBreakValue(
          item,
          weather,
          forecastAnalysis
        ),
        scoreBreakdown: {
          weatherSafetyRank: safetyAssessment.rank,
          warmth: warmthScore,
          rain: rainScore,
          wind: windScore,
          protectionSubtotal: protectionScore,
          profileStyle: profileStyleScore,
          favorite: favoriteBonus,
          storedPreference: storedPreferenceScore,
          contextualLearning: contextualLearningScore,
          exploration: explorationBonus,
          recentUsePenalty: recentRecommendationPenalty,
          overkillPenalty,
          protectionDeficitPenalty,
          final: score,
        },
        reasons: buildReasons({
          item,
          weatherNeeds,
          profileStyleScore,
          storedPreferenceScore,
          contextualLearningScore,
          recentRecommendationPenalty,
          overkillPenalty,
          protectionDeficitPenalty,
          favoriteBonus,
          safetyAssessment,
        }),
      };
    })
    .sort((first, second) => {
      if (
        second.safetyAssessment.rank !==
        first.safetyAssessment.rank
      ) {
        return (
          second.safetyAssessment.rank -
          first.safetyAssessment.rank
        );
      }

      if (second.score !== first.score) {
        return second.score - first.score;
      }

      if (
        first.recentRecommendationPenalty !==
        second.recentRecommendationPenalty
      ) {
        return (
          first.recentRecommendationPenalty -
          second.recentRecommendationPenalty
        );
      }

      if (second.tieBreakValue !== first.tieBreakValue) {
        return second.tieBreakValue - first.tieBreakValue;
      }

      return String(first.item.name || "").localeCompare(
        String(second.item.name || "")
      );
    });

  const rankedItems = diversifyRankedItems(baseRankedItems);

  return {
    bestItem: rankedItems[0]?.item || null,
    bestMatch: rankedItems[0] || null,
    topMatches: rankedItems.slice(
      0,
      RECOMMENDATION_CONFIG.ranking.topMatchCount
    ),
    rankedItems,
    excludedItems,
    eligibleItems,
    weatherNeeds,
  };
}
