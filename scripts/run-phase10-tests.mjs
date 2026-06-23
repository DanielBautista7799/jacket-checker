import assert from "node:assert/strict";
import fs from "node:fs";

import { buildCanonicalJacketDescriptor } from "../src/utils/buildCanonicalJacketDescriptor.js";
import {
  getDuplicateCandidates,
  normalizeJacketSimilarityMatch,
} from "../src/utils/jacketSimilarity.js";
import {
  getJacketEmbeddingStatusLabel,
  needsEmbeddingGeneration,
} from "../src/utils/jacketEmbeddingStatus.js";
import { rankClosetItems } from "../src/utils/rankClosetItems.js";
import { buildRecommendationDiagnostics } from "../src/utils/buildRecommendationDiagnostics.js";

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

function jacket(id, name, overrides = {}) {
  return {
    id,
    name,
    category: "jacket",
    subtype: "bomber",
    primary_color: "black",
    secondary_color: null,
    materials: ["nylon"],
    warmth_rating: 2,
    rain_rating: 2,
    wind_rating: 3,
    formality_rating: 1,
    fit: "regular",
    style_tags: ["streetwear"],
    weather_use: ["mild_weather"],
    favorite: false,
    archived: false,
    preference_score: 0,
    ...overrides,
  };
}

test("canonical descriptor is stable and jacket-specific", () => {
  const item = jacket("one", "Night Bomber", {
    primary_color: "navy",
    secondary_color: "white",
    rain_rating: 4,
  });

  const first = buildCanonicalJacketDescriptor(item);
  const second = buildCanonicalJacketDescriptor({ ...item });

  assert.equal(first, second);
  assert.match(first, /Night Bomber/);
  assert.match(first, /navy with white details/);
  assert.match(first, /strong rain protection/);
});

test("similarity categories require both vector and metadata evidence for duplicate label", () => {
  const match = normalizeJacketSimilarityMatch(
    {
      jacketId: "existing",
      vectorSimilarity: 0.95,
      category: "very_likely_duplicate",
      reasons: ["Same jacket type", "Same main color"],
    },
    [jacket("existing", "Existing Bomber")]
  );

  assert.equal(match.category, "very_likely_duplicate");
  assert.equal(getDuplicateCandidates([match]).length, 1);
});

test("embedding status helpers keep failed matching non-blocking", () => {
  assert.equal(getJacketEmbeddingStatusLabel("failed"), "Matching unavailable");
  assert.equal(needsEmbeddingGeneration({ status: "failed" }), true);
  assert.equal(needsEmbeddingGeneration({ status: "ready" }), false);
});

test("near-duplicate alternatives are diversified without changing the safest first choice", () => {
  const first = jacket("first", "Black Bomber One", {
    favorite: true,
    similarity_matches: [
      { jacketId: "second", similarity: 0.96, provider: "gemini", model: "test" },
    ],
  });
  const second = jacket("second", "Black Bomber Two", {
    similarity_matches: [
      { jacketId: "first", similarity: 0.96, provider: "gemini", model: "test" },
    ],
  });
  const third = jacket("third", "Black Rain Shell", {
    subtype: "rain_shell",
    primary_color: "black",
    rain_rating: 3,
    wind_rating: 3,
  });

  const ranking = rankClosetItems({
    closetItems: [first, second, third],
    weather: { city: "Test", localTime: "2026-06-23 12:00" },
    forecastAnalysis: {
      windowId: "rest_of_day",
      selectedConditions: {
        feelsLike: 61,
        lowestFeelsLike: 58,
        rainChance: 10,
        windSpeed: 8,
      },
    },
    profile: { style_preference: "streetwear", preferred_color: "black" },
  });

  assert.equal(ranking.rankedItems[0].item.id, "first");
  assert.equal(ranking.rankedItems[1].item.id, "third");
  assert.equal(ranking.rankedItems[2].similarityDiversityPenalty > 0, true);
});

test("diagnostic JSON includes visual metadata but excludes raw vectors and private URLs", () => {
  const item = jacket("first", "Black Bomber", {
    embedding: {
      status: "ready",
      provider: "gemini",
      model: "gemini-embedding-001",
      dimensions: 768,
      source_hash: "abcdef",
      embedding: [0.1, 0.2, 0.3],
    },
    image_url: "https://private.example/signed-image",
  });

  const ranking = rankClosetItems({
    closetItems: [item],
    weather: { city: "Test", localTime: "2026-06-23 12:00" },
    forecastAnalysis: {
      windowId: "rest_of_day",
      selectedConditions: {
        feelsLike: 55,
        lowestFeelsLike: 52,
        highestFeelsLike: 60,
        rainChance: 10,
        windSpeed: 5,
      },
    },
    profile: {},
  });

  const recommendation = {
    decision: "YES",
    score: 4,
    baseScore: 4,
    profileModifier: 0,
    closetMatch: ranking.bestMatch,
    allRankedClosetMatches: ranking.rankedItems,
    selectedConditions: {
      feelsLike: 55,
      lowestFeelsLike: 52,
      highestFeelsLike: 60,
      rainChance: 10,
      windSpeed: 5,
      condition: "Clear",
    },
    forecastAnalysis: {
      windowId: "rest_of_day",
      coverageLevel: "complete",
      selectedConditions: {
        feelsLike: 55,
        lowestFeelsLike: 52,
        highestFeelsLike: 60,
        rainChance: 10,
        windSpeed: 5,
        condition: "Clear",
      },
      windowHours: [{}],
    },
  };

  const diagnostics = buildRecommendationDiagnostics({
    recommendation,
    weather: { city: "Test" },
    profile: {},
    closetItems: [item],
    ranking,
  });

  const serialized = JSON.stringify(diagnostics);
  assert.equal(diagnostics.schemaVersion, "phase10-v1");
  assert.equal(diagnostics.visualIntelligence.statusCounts.ready, 1);
  assert.equal(serialized.includes("0.1"), false);
  assert.equal(serialized.includes("signed-image"), false);
  assert.equal(serialized.includes("abcdef"), false);
});

test("migration contains pgvector, RLS, HNSW, lifecycle triggers, and authenticated RPCs", () => {
  const sql = fs.readFileSync(
    new URL("../supabase/migrations/20260623010000_create_jacket_embeddings.sql", import.meta.url),
    "utf8"
  );

  for (const requirement of [
    "create extension if not exists vector",
    "alter table public.jacket_embeddings enable row level security",
    "using hnsw",
    "phase10_mark_jacket_embedding_stale",
    "phase10_mark_embedding_stale_from_image",
    "match_user_jackets",
    "get_user_jacket_similarity_pairs",
    "to authenticated",
  ]) {
    assert.equal(sql.toLowerCase().includes(requirement.toLowerCase()), true);
  }
});

let passed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    console.error(`FAIL  ${name}`);
    console.error(error);
  }
}

console.log(`\n${passed}/${tests.length} Phase 10 tests passed.`);
if (passed !== tests.length) {
  process.exitCode = 1;
}
