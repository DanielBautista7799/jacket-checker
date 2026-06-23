export const VISUAL_INTELLIGENCE_CONFIG = Object.freeze({
  version: "phase10-v1",
  matching: {
    minimumSimilarity: 0.72,
    relatedMinimum: 0.72,
    stronglySimilarMinimum: 0.86,
    veryLikelyDuplicateMinimum: 0.93,
    maximumResults: 8,
  },
  backfill: {
    concurrency: 2,
    automaticBatchSize: 3,
  },
  recommendation: {
    nearDuplicatePenalty: 3,
    duplicateAlternativeSimilarity: 0.9,
    onlyApplyWithinSafetyLevel: true,
  },
});

export const SIMILARITY_CATEGORY_LABELS = Object.freeze({
  very_likely_duplicate: "Very likely duplicate",
  strongly_similar: "Strongly similar",
  related: "Related jacket",
});

export function getSimilarityCategoryLabel(category) {
  return (
    SIMILARITY_CATEGORY_LABELS[category] ||
    "Similar jacket"
  );
}
