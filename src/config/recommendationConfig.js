export const RECOMMENDATION_CONFIG = {
  version: "9.1.0",

  weatherScore: {
    defaultFeelsLike: 65,
    temperatureBands: [
      {
        minimum: 80,
        key: "hot",
        score: -4,
      },
      {
        minimum: 72,
        key: "warm",
        score: -2,
      },
      {
        minimum: 66,
        key: "mild",
        score: 0,
      },
      {
        minimum: 61,
        key: "light_layer_optional",
        score: 1,
      },
      {
        minimum: 52,
        key: "cool",
        score: 3,
      },
      {
        minimum: 42,
        key: "jacket_weather",
        score: 5,
      },
      {
        minimum: 32,
        key: "cold",
        score: 7,
      },
      {
        minimum: Number.NEGATIVE_INFINITY,
        key: "very_cold",
        score: 9,
      },
    ],
    windBands: [
      {
        minimum: 22,
        score: 2,
      },
      {
        minimum: 14,
        score: 1,
      },
    ],
    rainBands: [
      {
        minimum: 60,
        score: 2,
      },
      {
        minimum: 35,
        score: 1,
      },
    ],
    forecastLow: {
      coldThreshold: 40,
      coldScore: 2,
      coolThreshold: 48,
      coolScore: 1,
    },
    temperatureDrop: {
      minimum: 12,
      score: 1,
    },
  },

  forecastWindow: {
    sustainedRainChance: 40,
    sustainedRainMinimumHours: 2,
    sustainedRainCoverage: 0.5,
  },

  decision: {
    yesMinimumScore: 3,
    clearNoMaximum: 0,
    backupLayerNoMaximum: 2,
    lightJacketMaximum: 4,
    mediumJacketMaximum: 7,
    insulatedJacketMaximum: 10,
    optionalRainChance: 50,
    optionalWindSpeed: 18,
    optionalCoolFeelsLike: 62,
  },

  profile: {
    coldTolerance: {
      cold: 3,
      neutral: 0,
      hot: -3,
    },
    rainSensitivity: {
      threshold: 30,
      high: 1,
      normal: 0,
      low: -1,
    },
    windSensitivity: {
      threshold: 12,
      high: 1,
      normal: 0,
      low: -1,
    },
    exposure: {
      long: {
        feelsLikeBelow: 70,
        score: 2,
      },
      medium: {
        feelsLikeBelow: 60,
        score: 1,
      },
      short: {
        feelsLikeAbove: 45,
        score: -1,
      },
    },
    age: {
      minimum: 55,
      feelsLikeBelow: 55,
      score: 1,
    },
  },

  protectionOverride: {
    rainChance: 60,
    precipitationConditionRainChance: 40,
    windSpeed: 22,
    warmWindowFeelsLike: 65,
    precipitationTerms: [
      "rain",
      "drizzle",
      "shower",
      "thunderstorm",
      "storm",
      "sleet",
      "snow",
      "freezing",
      "ice",
    ],
    winterPrecipitationTerms: [
      "sleet",
      "snow",
      "freezing",
      "ice",
    ],
  },

  weatherNeeds: {
    warmth: [
      {
        feelsLikeBelow: 30,
        rating: 5,
      },
      {
        feelsLikeBelow: 42,
        rating: 4,
      },
      {
        feelsLikeBelow: 52,
        rating: 3,
      },
      {
        feelsLikeBelow: 62,
        rating: 2,
      },
    ],
    rain: [
      {
        chanceAtLeast: 70,
        rating: 5,
      },
      {
        chanceAtLeast: 50,
        rating: 4,
      },
      {
        chanceAtLeast: 30,
        rating: 3,
      },
    ],
    precipitationConditionMinimum: 4,
    wind: [
      {
        speedAtLeast: 25,
        rating: 5,
      },
      {
        speedAtLeast: 20,
        rating: 4,
      },
      {
        speedAtLeast: 14,
        rating: 3,
      },
      {
        speedAtLeast: 9,
        rating: 2,
      },
    ],
  },

  ranking: {
    ratingMatchScores: {
      exact: 20,
      oneAbove: 15,
      oneBelow: 12,
      twoAbove: 8,
      twoBelow: 4,
      threeOrMoreAbove: 2,
      threeOrMoreBelow: -6,
    },
    protectionWeights: {
      required: 1,
      useful: 0.5,
      unnecessary: 0.2,
    },
    styleTagMatch: 12,
    preferredColorMatch: 8,
    favoriteBonus: 2,
    storedPreferenceMinimum: -10,
    storedPreferenceMaximum: 10,
    overkill: {
      warmthDifferenceThree: 10,
      warmthDifferenceTwo: 5,
      dryRainDifferenceThree: 3,
      calmWindDifferenceThree: 2,
    },
    deficit: {
      severeWarmthRatingOne: 12,
      severeWarmthRatingTwo: 7,
      severeRainRatingOne: 18,
      severeRainRatingTwo: 10,
      severeWindRatingOne: 14,
      severeWindRatingTwo: 8,
    },
    safety: {
      suitableRank: 2,
      limitedRank: 1,
      poorRank: 0,
    },
    explorationMaximum: 2,
    minimumFeedbackForExploration: 2,
    recentPenaltyBlocksExplorationAt: 2,
    topMatchCount: 3,
  },

  confidence: {
    highMinimum: 75,
    mediumMinimum: 50,
    penalties: {
      missingForecastCoverage: 35,
      partialForecastCoverage: 15,
      thresholdDistanceOneOrLess: 25,
      thresholdDistanceTwoOrLess: 12,
      changingConditions: 10,
      missingProfile: 10,
      missingJacketForYes: 28,
      onlyOneSuitableJacket: 8,
      closeTopJackets: 12,
      incompleteJacketMetadata: 8,
    },
    changingFeelsLikeRange: 15,
    closeTopJacketGap: 3,
  },
};

export function getRecommendationConfig() {
  return RECOMMENDATION_CONFIG;
}
