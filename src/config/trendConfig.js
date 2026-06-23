export const TREND_CONFIG = {
  version: "11.0.0",
  cacheTtlMs: 10 * 60 * 1000,
  maximumSelectedRules: 2,
  influenceWeights: {
    off: 0,
    subtle: 0.45,
    balanced: 1,
  },
  feedbackWeights: {
    classic: -2,
    feels_right: 1,
    more_current: 2,
  },
  minimumPrimaryScore: 2.25,
  minimumSupportingScore: 3.25,
  validStyles: [
    "streetwear",
    "minimal",
    "athletic",
    "smart_casual",
    "techwear",
    "vintage",
    "skater",
    "outdoor",
  ],
  validSeasons: ["spring", "summer", "fall", "winter", "transitional"],
  validClimateTags: [
    "hot",
    "warm",
    "mild",
    "cold",
    "rain",
    "wind",
    "rain_wind",
    "dry",
    "transitional",
  ],
  allowedFeedback: ["classic", "feels_right", "more_current"],
};

export function normalizeTrendInfluence(value) {
  if (value === "balanced") {
    return "balanced";
  }

  if (value === "off") {
    return "off";
  }

  return "subtle";
}
