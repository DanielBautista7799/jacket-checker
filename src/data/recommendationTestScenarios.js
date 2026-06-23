function createProfile(overrides = {}) {
  return {
    cold_tolerance: "neutral",
    rain_sensitivity: "normal",
    wind_sensitivity: "normal",
    default_exposure: "medium",
    style_preference: "minimal",
    preferred_color: "black",
    age: 25,
    ...overrides,
  };
}

function createJacket(id, overrides = {}) {
  return {
    id,
    name: `Test Jacket ${id}`,
    category: "jacket",
    subtype: "light_jacket",
    primary_color: "black",
    secondary_color: null,
    warmth_rating: 2,
    rain_rating: 2,
    wind_rating: 2,
    style_tags: ["minimal"],
    preference_score: 0,
    times_recommended: 0,
    favorite: false,
    archived: false,
    ...overrides,
  };
}

function toEpoch(dateString) {
  return Math.floor(new Date(`${dateString}:00Z`).getTime() / 1000);
}

function createWeather({
  city = "Scenario City",
  localTime = "2026-01-15 12:00",
  temperature = 65,
  feelsLike = temperature,
  rainChance = 0,
  windSpeed = 5,
  condition = "Clear",
  forecastHours = [],
} = {}) {
  return {
    city,
    region: "Test Region",
    country: "Test Country",
    localTime,
    currentEpoch: toEpoch(localTime),
    temperature,
    feelsLike,
    rainChance,
    windSpeed,
    maxWind: windSpeed,
    condition,
    forecastHours,
  };
}

function createForecastHours({
  date = "2026-01-15",
  startHour = 12,
  values = [],
}) {
  return values.map((value, index) => {
    const hour = startHour + index;
    const time = `${date} ${String(hour).padStart(2, "0")}:00`;

    return {
      time,
      timeEpoch: toEpoch(time),
      temperature: value.temperature ?? value.feelsLike,
      feelsLike: value.feelsLike,
      rainChance: value.rainChance ?? 0,
      windSpeed: value.windSpeed ?? 5,
      condition: value.condition || "Clear",
    };
  });
}

function createPreferenceModel(overrides = {}) {
  return {
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
    totalFeedback: 0,
    totalHistory: 0,
    ...overrides,
  };
}

const lightJacket = createJacket("light", {
  name: "Light Jacket",
  subtype: "light_jacket",
  warmth_rating: 2,
  rain_rating: 2,
  wind_rating: 2,
});

const mediumJacket = createJacket("medium", {
  name: "Medium Jacket",
  subtype: "field_jacket",
  primary_color: "olive",
  warmth_rating: 3,
  rain_rating: 3,
  wind_rating: 3,
  style_tags: ["minimal", "outdoor"],
});

const puffer = createJacket("puffer", {
  name: "Warm Puffer",
  subtype: "puffer",
  primary_color: "navy",
  warmth_rating: 5,
  rain_rating: 2,
  wind_rating: 4,
  style_tags: ["streetwear", "outdoor"],
});

const rainShell = createJacket("rain-shell", {
  name: "Rain Shell",
  subtype: "rain_shell",
  primary_color: "blue",
  warmth_rating: 1,
  rain_rating: 5,
  wind_rating: 4,
  style_tags: ["minimal", "outdoor", "techwear"],
});

const windbreaker = createJacket("windbreaker", {
  name: "Windbreaker",
  subtype: "windbreaker",
  primary_color: "black",
  warmth_rating: 1,
  rain_rating: 3,
  wind_rating: 5,
  style_tags: ["minimal", "athletic", "techwear"],
});

const waterproofParka = createJacket("parka", {
  name: "Waterproof Parka",
  subtype: "parka",
  primary_color: "black",
  warmth_rating: 5,
  rain_rating: 5,
  wind_rating: 5,
  style_tags: ["minimal", "outdoor"],
});

const mildWeather = createWeather({
  temperature: 64,
  feelsLike: 64,
});

const rainWeather = createWeather({
  temperature: 72,
  feelsLike: 72,
  rainChance: 85,
  windSpeed: 9,
  condition: "Heavy rain",
});

const windWeather = createWeather({
  temperature: 72,
  feelsLike: 72,
  rainChance: 0,
  windSpeed: 28,
  condition: "Windy",
});

export const RECOMMENDATION_TEST_SCENARIOS = [
  {
    id: "hot-dry-no",
    name: "Hot and dry",
    description: "Hot calm weather should not require a jacket.",
    input: {
      weather: createWeather({
        temperature: 88,
        feelsLike: 92,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, mediumJacket],
    },
    expected: {
      decision: "NO",
      protectionOverrideApplied: false,
    },
  },
  {
    id: "warm-dry-no",
    name: "Warm and dry",
    description: "Warm dry weather should return NO.",
    input: {
      weather: createWeather({
        temperature: 76,
        feelsLike: 76,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket],
    },
    expected: {
      decision: "NO",
    },
  },
  {
    id: "warm-heavy-rain",
    name: "Warm heavy rain",
    description: "Protection should override a warm-weather NO.",
    input: {
      weather: rainWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, rainShell],
    },
    expected: {
      decision: "YES",
      recommendationBasis: "rain_protection",
      protectionOverrideApplied: true,
      selectedJacketId: "rain-shell",
    },
  },
  {
    id: "warm-strong-wind",
    name: "Warm strong wind",
    description: "Strong wind should trigger protective outerwear.",
    input: {
      weather: windWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, windbreaker],
    },
    expected: {
      decision: "YES",
      recommendationBasis: "wind_protection",
      protectionOverrideApplied: true,
      selectedJacketId: "windbreaker",
    },
  },
  {
    id: "mild-calm-no",
    name: "Mild and calm",
    description: "Mild calm weather should remain below the YES boundary.",
    input: {
      weather: mildWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, mediumJacket],
    },
    expected: {
      decision: "NO",
    },
  },
  {
    id: "mild-rain-yes",
    name: "Mild rain",
    description: "Cool rainy weather should support a jacket.",
    input: {
      weather: createWeather({
        temperature: 57,
        feelsLike: 55,
        rainChance: 75,
        windSpeed: 10,
        condition: "Rain",
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [mediumJacket, rainShell],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "rain-shell",
    },
  },
  {
    id: "cold-dry-yes",
    name: "Cold and dry",
    description: "Cold dry weather should return YES.",
    input: {
      weather: createWeather({
        temperature: 41,
        feelsLike: 38,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, puffer],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "puffer",
    },
  },
  {
    id: "cold-rain-yes",
    name: "Cold rain",
    description: "Cold rain should favor warm waterproof protection.",
    input: {
      weather: createWeather({
        temperature: 39,
        feelsLike: 35,
        rainChance: 90,
        windSpeed: 16,
        condition: "Cold rain",
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [puffer, rainShell, waterproofParka],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "parka",
      topSafetyLevel: "suitable",
    },
  },
  {
    id: "very-cold-yes",
    name: "Very cold",
    description: "Very cold weather should choose the warmest safe option.",
    input: {
      weather: createWeather({
        temperature: 20,
        feelsLike: 14,
        windSpeed: 18,
        condition: "Clear",
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket, mediumJacket, puffer],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "puffer",
    },
  },
  {
    id: "evening-temperature-drop",
    name: "Large evening temperature drop",
    description: "A forecasted drop should push a close result toward YES.",
    input: {
      weather: createWeather({
        localTime: "2026-01-15 12:00",
        temperature: 70,
        feelsLike: 70,
        forecastHours: createForecastHours({
          values: [
            { feelsLike: 70 },
            { feelsLike: 68 },
            { feelsLike: 65 },
            { feelsLike: 61 },
            { feelsLike: 57 },
            { feelsLike: 52 },
            { feelsLike: 47 },
            { feelsLike: 44 },
          ],
        }),
      }),
      profile: createProfile(),
      windowId: "rest_of_day",
      closetItems: [lightJacket, mediumJacket],
    },
    expected: {
      decision: "YES",
    },
  },
  {
    id: "run-hot-close-call",
    name: "Run-hot profile",
    description: "A run-hot profile should lower a close recommendation.",
    input: {
      weather: createWeather({
        temperature: 56,
        feelsLike: 54,
      }),
      profile: createProfile({
        cold_tolerance: "hot",
      }),
      windowId: "now",
      closetItems: [lightJacket, mediumJacket],
    },
    expected: {
      decision: "NO",
    },
  },
  {
    id: "run-cold-close-call",
    name: "Run-cold profile",
    description: "A run-cold profile should raise a close recommendation.",
    input: {
      weather: mildWeather,
      profile: createProfile({
        cold_tolerance: "cold",
      }),
      windowId: "now",
      closetItems: [lightJacket, mediumJacket],
    },
    expected: {
      decision: "YES",
    },
  },
  {
    id: "neutral-profile-boundary",
    name: "Neutral profile",
    description: "Neutral profile behavior should remain stable.",
    input: {
      weather: mildWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [lightJacket],
    },
    expected: {
      decision: "NO",
    },
  },
  {
    id: "no-jackets",
    name: "No jackets",
    description: "The weather decision can be YES without an owned match.",
    input: {
      weather: createWeather({
        temperature: 45,
        feelsLike: 42,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [],
    },
    expected: {
      decision: "YES",
      hasClosetMatch: false,
      eligibleCount: 0,
    },
  },
  {
    id: "one-suitable-jacket",
    name: "One suitable jacket",
    description: "A single suitable jacket should be selected.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [mediumJacket],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "medium",
      topSafetyLevel: "suitable",
    },
  },
  {
    id: "one-unsuitable-jacket",
    name: "One unsuitable jacket",
    description: "The only jacket remains visible but is marked as a poor match.",
    input: {
      weather: rainWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [
        createJacket("cotton-only", {
          name: "Cotton Jacket",
          warmth_rating: 2,
          rain_rating: 1,
          wind_rating: 1,
        }),
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "cotton-only",
      topSafetyLevel: "poor",
    },
  },
  {
    id: "deterministic-tie",
    name: "Several tied jackets",
    description: "Ties should resolve deterministically.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile({
        preferred_color: null,
        style_preference: null,
      }),
      windowId: "now",
      closetItems: [
        createJacket("tie-a", {
          name: "Tie A",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
        createJacket("tie-b", {
          name: "Tie B",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
      ],
    },
    expected: {
      decision: "YES",
      deterministic: true,
    },
  },
  {
    id: "archived-excluded",
    name: "Archived jacket",
    description: "Archived jackets must never rank.",
    input: {
      weather: createWeather({
        temperature: 45,
        feelsLike: 42,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [
        createJacket("archived", {
          name: "Archived Parka",
          archived: true,
          warmth_rating: 5,
        }),
        mediumJacket,
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "medium",
      excludedCodesIncludes: ["archived"],
    },
  },
  {
    id: "favorite-close-match",
    name: "Favorite jacket",
    description: "Favorite status may break a close safe tie.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile({
        preferred_color: null,
        style_preference: null,
      }),
      windowId: "now",
      closetItems: [
        createJacket("favorite", {
          name: "Favorite Field Jacket",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          favorite: true,
          style_tags: [],
        }),
        createJacket("regular", {
          name: "Regular Field Jacket",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "favorite",
    },
  },
  {
    id: "poor-rain-protection",
    name: "Poor rain protection",
    description: "A safe shell must beat a highly liked non-waterproof jacket.",
    input: {
      weather: rainWeather,
      profile: createProfile(),
      windowId: "now",
      closetItems: [
        createJacket("liked-denim", {
          name: "Liked Denim Jacket",
          subtype: "denim_jacket",
          warmth_rating: 2,
          rain_rating: 1,
          wind_rating: 2,
          preference_score: 10,
        }),
        rainShell,
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "rain-shell",
      topSafetyLevel: "suitable",
    },
  },
  {
    id: "poor-wind-protection",
    name: "Poor wind protection",
    description: "Wind safety must beat style preference.",
    input: {
      weather: windWeather,
      profile: createProfile({
        preferred_color: "blue",
      }),
      windowId: "now",
      closetItems: [
        createJacket("blue-cardigan", {
          name: "Blue Cardigan",
          subtype: "cardigan",
          primary_color: "blue",
          warmth_rating: 2,
          rain_rating: 1,
          wind_rating: 1,
          preference_score: 10,
        }),
        windbreaker,
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "windbreaker",
      topSafetyLevel: "suitable",
    },
  },
  {
    id: "overly-warm-jacket",
    name: "Overly warm jacket",
    description: "A puffer should lose to a lighter option in cool weather.",
    input: {
      weather: createWeather({
        temperature: 58,
        feelsLike: 56,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [puffer, lightJacket, mediumJacket],
    },
    expected: {
      decision: "YES",
      selectedJacketNot: "puffer",
    },
  },
  {
    id: "positive-rain-feedback",
    name: "Positive rain feedback",
    description: "Context feedback should break a safe rain tie.",
    input: {
      weather: rainWeather,
      profile: createProfile({
        preferred_color: null,
        style_preference: null,
      }),
      windowId: "now",
      closetItems: [
        rainShell,
        createJacket("rain-shell-two", {
          name: "Second Rain Shell",
          subtype: "rain_shell",
          primary_color: "green",
          warmth_rating: 1,
          rain_rating: 5,
          wind_rating: 4,
          style_tags: [],
        }),
      ],
      preferenceModel: createPreferenceModel({
        contextItems: {
          "rain|rain-shell": 4,
        },
        totalFeedback: 3,
      }),
    },
    expected: {
      decision: "YES",
      selectedJacketId: "rain-shell",
    },
  },
  {
    id: "negative-mild-feedback",
    name: "Negative mild-weather feedback",
    description: "Negative context feedback should move a close mild match down.",
    input: {
      weather: createWeather({
        temperature: 57,
        feelsLike: 55,
      }),
      profile: createProfile({
        preferred_color: null,
        style_preference: null,
      }),
      windowId: "now",
      closetItems: [
        createJacket("mild-rejected", {
          name: "Rejected Mild Jacket",
          warmth_rating: 2,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
        createJacket("mild-alternate", {
          name: "Mild Alternate",
          warmth_rating: 2,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
      ],
      preferenceModel: createPreferenceModel({
        contextItems: {
          "mild|mild-rejected": -4,
        },
        totalFeedback: 3,
      }),
    },
    expected: {
      decision: "YES",
      selectedJacketId: "mild-alternate",
    },
  },
  {
    id: "recent-repetition",
    name: "Recent recommendation repetition",
    description: "Recent-use penalties should rotate equally safe jackets.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile({
        preferred_color: null,
        style_preference: null,
      }),
      windowId: "now",
      closetItems: [
        createJacket("recent", {
          name: "Recently Used",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
        createJacket("fresh", {
          name: "Fresh Alternative",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 2,
          style_tags: [],
        }),
      ],
      preferenceModel: createPreferenceModel({
        recentItems: {
          recent: 3,
        },
        lastRecommendedItemId: "recent",
        totalHistory: 4,
      }),
    },
    expected: {
      decision: "YES",
      selectedJacketId: "fresh",
    },
  },
  {
    id: "not-it-exclusion",
    name: "Not It exclusion",
    description: "A jacket excluded for the active check must not rank.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [mediumJacket, lightJacket],
      excludedItemIds: ["medium"],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "light",
      excludedCodesIncludes: ["feedback_excluded"],
    },
  },
  {
    id: "close-alternatives",
    name: "Several close alternatives",
    description: "The top three should remain available and explainable.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile({
        preferred_color: null,
      }),
      windowId: "now",
      closetItems: [
        mediumJacket,
        createJacket("close-two", {
          name: "Close Two",
          warmth_rating: 3,
          rain_rating: 3,
          wind_rating: 2,
        }),
        createJacket("close-three", {
          name: "Close Three",
          warmth_rating: 3,
          rain_rating: 2,
          wind_rating: 3,
        }),
        puffer,
      ],
    },
    expected: {
      decision: "YES",
      minimumTopMatches: 3,
    },
  },
  {
    id: "non-jacket-excluded",
    name: "Non-jacket record",
    description: "Legacy non-jacket rows must remain outside ranking.",
    input: {
      weather: createWeather({
        temperature: 50,
        feelsLike: 48,
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [
        mediumJacket,
        {
          ...createJacket("shirt"),
          name: "Legacy Shirt",
          category: "top",
        },
      ],
    },
    expected: {
      decision: "YES",
      selectedJacketId: "medium",
      excludedCodesIncludes: ["non_jacket"],
    },
  },
  {
    id: "rain-and-wind-protection",
    name: "Rain and wind together",
    description: "Combined weather should require combined protection.",
    input: {
      weather: createWeather({
        temperature: 74,
        feelsLike: 73,
        rainChance: 85,
        windSpeed: 29,
        condition: "Heavy rain and wind",
      }),
      profile: createProfile(),
      windowId: "now",
      closetItems: [rainShell, windbreaker, waterproofParka],
    },
    expected: {
      decision: "YES",
      recommendationBasis: "rain_wind_protection",
      protectionOverrideApplied: true,
      selectedJacketId: "rain-shell",
    },
  },
];

export const RECOMMENDATION_SCENARIO_COUNT =
  RECOMMENDATION_TEST_SCENARIOS.length;
