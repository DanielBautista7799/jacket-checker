import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { DEFAULT_TREND_RULES } from "../src/data/defaultTrendRules.js";
import { getActiveTrendRules } from "../src/utils/getActiveTrendRules.js";
import { matchStyleTrendRules } from "../src/utils/matchStyleTrendRules.js";
import { applyTrendRules } from "../src/utils/applyTrendRules.js";
import { generateStyleSuggestion } from "../src/utils/generateStyleSuggestion.js";
import { calculatePersonalizedRecommendation } from "../src/utils/calculatePersonalizedRecommendation.js";

const results = [];

async function test(name, callback) {
  try {
    await callback();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error });
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

const summerDate = new Date("2026-07-15T16:00:00.000Z");
const profile = {
  style_preference: "streetwear",
  fit_preference: "relaxed",
  preferred_color: "black",
  cold_tolerance: "normal",
  rain_sensitivity: "normal",
  wind_sensitivity: "normal",
  default_exposure: "medium",
  use_style_trends: true,
  trend_influence: "subtle",
};

const jacket = {
  id: "test-jacket",
  category: "jacket",
  archived: false,
  name: "Navy bomber",
  subtype: "bomber",
  primary_color: "navy",
  secondary_color: "white",
  materials: ["nylon"],
  fit: "relaxed",
  warmth_rating: 2,
  rain_rating: 2,
  wind_rating: 3,
  style_tags: ["streetwear"],
};

const weather = {
  city: "Test City",
  localTime: "2026-07-15 12:00",
  temperature: 68,
  feelsLike: 65,
  windSpeed: 10,
  rainChance: 10,
  condition: "Clear",
  forecastDays: [],
};

await test("local fallback contains sixteen reusable trend rules", () => {
  assert.equal(DEFAULT_TREND_RULES.length, 16);
});

await test("all eight supported styles have an active summer rule", () => {
  const styles = [
    "streetwear",
    "minimal",
    "athletic",
    "smart_casual",
    "techwear",
    "vintage",
    "skater",
    "outdoor",
  ];

  for (const style of styles) {
    const active = getActiveTrendRules({
      rules: DEFAULT_TREND_RULES,
      profile: { ...profile, style_preference: style },
      style,
      date: summerDate,
      temperatureBand: "warm",
      weatherState: "default",
    });
    assert.ok(active.activeRules.length > 0, `${style} has no active summer rule`);
  }
});

await test("trends off returns no active rules", () => {
  const active = getActiveTrendRules({
    rules: DEFAULT_TREND_RULES,
    profile: { ...profile, use_style_trends: false },
    style: "streetwear",
    date: summerDate,
  });
  assert.equal(active.enabled, false);
  assert.equal(active.activeRules.length, 0);
});

await test("expired and inactive rules are ignored", () => {
  const active = getActiveTrendRules({
    rules: [
      { ...DEFAULT_TREND_RULES[0], expires_at: "2020-01-01T00:00:00Z" },
      { ...DEFAULT_TREND_RULES[1], is_active: false },
    ],
    profile,
    style: "streetwear",
    date: summerDate,
  });
  assert.equal(active.activeRules.length, 0);
  assert.deepEqual(active.ignoredRules.map((entry) => entry.reason).sort(), ["expired", "inactive"]);
});

await test("style conflicts are ignored before matching", () => {
  const active = getActiveTrendRules({
    rules: DEFAULT_TREND_RULES,
    profile: { ...profile, style_preference: "minimal" },
    style: "minimal",
    date: summerDate,
    temperatureBand: "warm",
  });
  assert.ok(active.activeRules.every((rule) => rule.style_tags.includes("minimal")));
});

await test("streetwear trend matching selects a relevant rule", () => {
  const active = getActiveTrendRules({
    rules: DEFAULT_TREND_RULES,
    profile,
    style: "streetwear",
    date: summerDate,
    temperatureBand: "warm",
    weatherState: "default",
  });
  const matched = matchStyleTrendRules({ activeResult: active, style: "streetwear", jacket });
  assert.ok(matched.primary);
  assert.ok(matched.primary.rule.style_tags.includes("streetwear"));
});

await test("subtle influence applies one compact trend note", () => {
  const result = applyTrendRules({
    styleSuggestion: { title: "Streetwear", summary: "Base suggestion." },
    rules: DEFAULT_TREND_RULES,
    profile,
    style: "streetwear",
    jacket,
    temperatureBand: "warm",
    weatherState: "default",
    rainChance: 10,
    windSpeed: 10,
    source: "fallback",
    date: summerDate,
    seedText: "stable",
  });
  assert.equal(result.trend.influence, "subtle");
  assert.equal(result.trend.adjustmentApplied, true);
  assert.ok(result.trendNote.length > 20);
});

await test("style suggestion remains deterministic with trend rules", () => {
  const input = {
    recommendation: { decision: "YES", recommendationBasis: "temperature" },
    weather,
    profile,
    closetItem: jacket,
    forecastAnalysis: {
      windowId: "rest_of_day",
      selectedConditions: {
        feelsLike: 65,
        lowestFeelsLike: 61,
        rainChance: 10,
        windSpeed: 10,
        condition: "Clear",
      },
    },
    activeTrendRules: DEFAULT_TREND_RULES,
    trendSource: "fallback",
  };
  const first = generateStyleSuggestion(input);
  const second = generateStyleSuggestion(input);
  assert.deepEqual(first, second);
});

await test("rain and wind select weather-relevant outdoor language", () => {
  const outdoorProfile = { ...profile, style_preference: "outdoor", trend_influence: "balanced" };
  const result = generateStyleSuggestion({
    recommendation: { decision: "YES", recommendationBasis: "rain_wind_protection" },
    weather: { ...weather, feelsLike: 45, rainChance: 85, windSpeed: 27, condition: "Rain" },
    profile: outdoorProfile,
    closetItem: { ...jacket, subtype: "rain jacket", materials: ["nylon", "technical"] },
    forecastAnalysis: {
      windowId: "rest_of_day",
      selectedConditions: {
        feelsLike: 45,
        lowestFeelsLike: 41,
        rainChance: 85,
        windSpeed: 27,
        condition: "Rain",
      },
    },
    activeTrendRules: DEFAULT_TREND_RULES,
    trendSource: "fallback",
  });
  assert.equal(result.weatherState, "rain_wind");
  assert.ok(result.trend.adjustmentApplied);
  assert.match(result.trendNote.toLowerCase(), /weather|layer|outside|functional|practical/);
});

await test("trend data never changes the YES or NO decision", () => {
  const baseArguments = {
    weather: {
      ...weather,
      forecast: {
        forecastday: [],
      },
    },
    profile,
    windowId: "rest_of_day",
    closetItems: [jacket],
    preferenceModel: null,
    location: { name: "Test City", lat: 35, lon: -79 },
  };
  const withoutTrends = calculatePersonalizedRecommendation(baseArguments);
  const withTrends = calculatePersonalizedRecommendation({
    ...baseArguments,
    activeTrendRules: DEFAULT_TREND_RULES,
    trendSource: "fallback",
  });
  assert.equal(withTrends.decision, withoutTrends.decision);
  assert.equal(withTrends.score, withoutTrends.score);
});

await test("Phase 11 source contains no shopping, price, retailer, or affiliate mechanics", async () => {
  const files = [
    "../src/config/trendConfig.js",
    "../src/data/defaultTrendRules.js",
    "../src/utils/applyTrendRules.js",
    "../src/pages/DeveloperTrendsPage.jsx",
  ];
  const content = (
    await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")))
  ).join("\n").toLowerCase();
  assert.doesNotMatch(content, /affiliate|retailer|product price|shopping recommendation|buy now/);
});

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
console.log(`\n${passed}/${results.length} Phase 11 tests passed, ${failed} failed.`);

if (failed > 0) process.exit(1);
