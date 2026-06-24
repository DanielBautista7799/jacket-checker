import { describe, expect, it } from "vitest";
import { runRecommendationScenarios } from "../../src/utils/runRecommendationScenarios";
import { calculateProfileModifier } from "../../src/utils/calculateProfileModifier";

describe("recommendation safety regression", () => {
  it("passes every deterministic recommendation scenario", () => {
    const result = runRecommendationScenarios();
    expect(result.failed, result.results.filter((entry) => !entry.passed).map((entry) => entry.name).join(", ")).toBe(0);
  });

  it("makes run-cold profiles warmer than run-hot profiles", () => {
    const weather = { feelsLike: 50, rainChance: 0, windSpeed: 5 };
    const cold = calculateProfileModifier({ cold_tolerance: "cold", rain_sensitivity: "normal", wind_sensitivity: "normal", default_exposure: "medium" }, weather);
    const hot = calculateProfileModifier({ cold_tolerance: "hot", rain_sensitivity: "normal", wind_sensitivity: "normal", default_exposure: "medium" }, weather);
    expect(cold.modifier).toBeGreaterThan(hot.modifier);
  });
});
