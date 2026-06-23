import {
  VISUAL_INTELLIGENCE_CONFIG,
  getSimilarityCategoryLabel,
} from "../config/visualIntelligenceConfig.js";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeJacketSimilarityMatch(match, wardrobeItems = []) {
  if (!match || typeof match !== "object") {
    return null;
  }

  const wardrobeItem = wardrobeItems.find(
    (item) => item.id === match.jacketId
  );

  const jacket = wardrobeItem || match.jacket || null;
  if (!jacket) {
    return null;
  }

  const vectorSimilarity = toNumber(match.vectorSimilarity);
  let category = match.category || "related";

  if (!match.category) {
    if (
      vectorSimilarity >=
      VISUAL_INTELLIGENCE_CONFIG.matching.veryLikelyDuplicateMinimum
    ) {
      category = "very_likely_duplicate";
    } else if (
      vectorSimilarity >=
      VISUAL_INTELLIGENCE_CONFIG.matching.stronglySimilarMinimum
    ) {
      category = "strongly_similar";
    }
  }

  return {
    ...match,
    jacket,
    category,
    label: match.label || getSimilarityCategoryLabel(category),
    vectorSimilarity,
    reasons: Array.isArray(match.reasons) ? match.reasons : [],
  };
}

export function normalizeJacketSimilarityMatches(matches, wardrobeItems = []) {
  return (Array.isArray(matches) ? matches : [])
    .map((match) => normalizeJacketSimilarityMatch(match, wardrobeItems))
    .filter(Boolean);
}

export function getDuplicateCandidates(matches) {
  return (Array.isArray(matches) ? matches : []).filter((match) =>
    ["very_likely_duplicate", "strongly_similar"].includes(match.category)
  );
}
