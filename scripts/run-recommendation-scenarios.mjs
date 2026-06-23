import { runRecommendationScenarios } from "../src/utils/runRecommendationScenarios.js";

const suite = runRecommendationScenarios();

console.log("\nJacket Checker recommendation scenarios\n");

suite.results.forEach((result) => {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`${status}  ${result.name}`);

  if (!result.passed) {
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }

    result.assertions
      .filter((assertion) => !assertion.passed)
      .forEach((assertion) => {
        console.log(
          `      ${assertion.label}: expected ${String(
            assertion.expected
          )}, received ${String(assertion.actual)}`
        );
      });
  }
});

console.log(
  `\n${suite.passed}/${suite.total} passed, ${suite.failed} failed.\n`
);

if (!suite.allPassed) {
  process.exitCode = 1;
}
