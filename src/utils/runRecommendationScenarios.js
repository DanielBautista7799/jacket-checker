import { RECOMMENDATION_TEST_SCENARIOS } from "../data/recommendationTestScenarios.js";
import { calculatePersonalizedRecommendation } from "./calculatePersonalizedRecommendation.js";

function createAssertion(label, expected, actual, passed) {
  return {
    label,
    expected,
    actual,
    passed,
  };
}

function getSelectedJacketId(recommendation) {
  return recommendation?.closetMatch?.item?.id || null;
}

function getTopSafetyLevel(recommendation) {
  return (
    recommendation?.diagnostics?.jacketRanking?.ranked?.[0]
      ?.safety?.level || null
  );
}

function getExcludedCodes(recommendation) {
  return (
    recommendation?.diagnostics?.jacketRanking?.excluded || []
  ).map((entry) => entry.reasonCode);
}

function getEligibleCount(recommendation) {
  return (
    recommendation?.diagnostics?.jacketRanking?.eligibleCount || 0
  );
}

function getTopMatchCount(recommendation) {
  return recommendation?.rankedClosetMatches?.length || 0;
}

function evaluateScenarioExpectation({
  expected,
  recommendation,
  secondRecommendation,
}) {
  const assertions = [];
  const selectedJacketId = getSelectedJacketId(recommendation);

  if (expected.decision !== undefined) {
    assertions.push(
      createAssertion(
        "Decision",
        expected.decision,
        recommendation?.decision || null,
        recommendation?.decision === expected.decision
      )
    );
  }

  if (expected.recommendationBasis !== undefined) {
    assertions.push(
      createAssertion(
        "Recommendation basis",
        expected.recommendationBasis,
        recommendation?.recommendationBasis || null,
        recommendation?.recommendationBasis ===
          expected.recommendationBasis
      )
    );
  }

  if (expected.protectionOverrideApplied !== undefined) {
    const actual =
      recommendation?.protectionOverride?.applied === true;

    assertions.push(
      createAssertion(
        "Protection override",
        expected.protectionOverrideApplied,
        actual,
        actual === expected.protectionOverrideApplied
      )
    );
  }

  if (expected.selectedJacketId !== undefined) {
    assertions.push(
      createAssertion(
        "Selected jacket",
        expected.selectedJacketId,
        selectedJacketId,
        selectedJacketId === expected.selectedJacketId
      )
    );
  }

  if (expected.selectedJacketNot !== undefined) {
    assertions.push(
      createAssertion(
        "Rejected selected jacket",
        `not ${expected.selectedJacketNot}`,
        selectedJacketId,
        selectedJacketId !== expected.selectedJacketNot
      )
    );
  }

  if (expected.hasClosetMatch !== undefined) {
    const actual = Boolean(recommendation?.closetMatch?.item);

    assertions.push(
      createAssertion(
        "Owned jacket match",
        expected.hasClosetMatch,
        actual,
        actual === expected.hasClosetMatch
      )
    );
  }

  if (expected.topSafetyLevel !== undefined) {
    const actual = getTopSafetyLevel(recommendation);

    assertions.push(
      createAssertion(
        "Top safety level",
        expected.topSafetyLevel,
        actual,
        actual === expected.topSafetyLevel
      )
    );
  }

  if (expected.eligibleCount !== undefined) {
    const actual = getEligibleCount(recommendation);

    assertions.push(
      createAssertion(
        "Eligible jacket count",
        expected.eligibleCount,
        actual,
        actual === expected.eligibleCount
      )
    );
  }

  if (expected.minimumTopMatches !== undefined) {
    const actual = getTopMatchCount(recommendation);

    assertions.push(
      createAssertion(
        "Top match count",
        `at least ${expected.minimumTopMatches}`,
        actual,
        actual >= expected.minimumTopMatches
      )
    );
  }

  if (Array.isArray(expected.excludedCodesIncludes)) {
    const actual = getExcludedCodes(recommendation);

    expected.excludedCodesIncludes.forEach((code) => {
      assertions.push(
        createAssertion(
          `Excluded reason ${code}`,
          true,
          actual.includes(code),
          actual.includes(code)
        )
      );
    });
  }

  if (expected.deterministic === true) {
    const firstSelected = getSelectedJacketId(recommendation);
    const secondSelected = getSelectedJacketId(
      secondRecommendation
    );
    const firstDecision = recommendation?.decision || null;
    const secondDecision = secondRecommendation?.decision || null;
    const passed =
      firstSelected === secondSelected &&
      firstDecision === secondDecision;

    assertions.push(
      createAssertion(
        "Deterministic repeat",
        `${firstDecision}/${firstSelected}`,
        `${secondDecision}/${secondSelected}`,
        passed
      )
    );
  }

  return assertions;
}

export function runRecommendationScenario(scenario) {
  try {
    const recommendation =
      calculatePersonalizedRecommendation({
        ...scenario.input,
        location: scenario.input.location || {
          name: "Scenario City",
          region: "Test Region",
          country: "Test Country",
        },
      });

    const secondRecommendation = scenario.expected.deterministic
      ? calculatePersonalizedRecommendation({
          ...scenario.input,
          location: scenario.input.location || {
            name: "Scenario City",
            region: "Test Region",
            country: "Test Country",
          },
        })
      : null;

    const assertions = evaluateScenarioExpectation({
      expected: scenario.expected,
      recommendation,
      secondRecommendation,
    });

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      passed: assertions.every((assertion) => assertion.passed),
      assertions,
      actual: {
        decision: recommendation?.decision || null,
        recommendationBasis:
          recommendation?.recommendationBasis || null,
        selectedJacketId: getSelectedJacketId(recommendation),
        confidence:
          recommendation?.diagnostics?.decision?.confidence?.level ||
          null,
        eligibleCount: getEligibleCount(recommendation),
        excludedCodes: getExcludedCodes(recommendation),
        topSafetyLevel: getTopSafetyLevel(recommendation),
      },
      diagnostics: recommendation?.diagnostics || null,
      error: null,
    };
  } catch (error) {
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      passed: false,
      assertions: [],
      actual: null,
      diagnostics: null,
      error: error?.message || String(error),
    };
  }
}

export function runRecommendationScenarios(
  scenarios = RECOMMENDATION_TEST_SCENARIOS
) {
  const startedAt = new Date().toISOString();
  const results = scenarios.map(runRecommendationScenario);
  const passedCount = results.filter(
    (result) => result.passed
  ).length;
  const failedCount = results.length - passedCount;

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    allPassed: failedCount === 0,
    results,
  };
}
