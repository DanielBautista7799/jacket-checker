import {
  CheckCircle2,
  FlaskConical,
  Play,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { RECOMMENDATION_TEST_SCENARIOS } from "../data/recommendationTestScenarios.js";
import { runRecommendationScenarios } from "../utils/runRecommendationScenarios.js";

function RecommendationScenarioRunner() {
  const [suite, setSuite] = useState(null);
  const [running, setRunning] = useState(false);
  const [showOnlyFailures, setShowOnlyFailures] = useState(false);

  const visibleResults = useMemo(() => {
    if (!suite) {
      return [];
    }

    return showOnlyFailures
      ? suite.results.filter((result) => !result.passed)
      : suite.results;
  }, [suite, showOnlyFailures]);

  const runSuite = () => {
    setRunning(true);

    window.setTimeout(() => {
      setSuite(runRecommendationScenarios());
      setRunning(false);
    }, 0);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-emerald-300" />
            <h2 className="text-xl font-black text-white">
              Recommendation scenario suite
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Runs {RECOMMENDATION_TEST_SCENARIOS.length} deterministic
            weather, profile, safety, feedback, and ranking checks entirely
            in memory. It never reads or writes Supabase data.
          </p>
        </div>

        <button
          type="button"
          onClick={runSuite}
          disabled={running}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          <Play size={17} />
          {running ? "Running..." : "Run all scenarios"}
        </button>
      </div>

      {suite && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {suite.total}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-200">
                Passed
              </p>
              <p className="mt-1 text-3xl font-black text-emerald-100">
                {suite.passed}
              </p>
            </div>
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-xs uppercase tracking-wide text-red-200">
                Failed
              </p>
              <p className="mt-1 text-3xl font-black text-red-100">
                {suite.failed}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p
              className={`text-sm font-black ${
                suite.allPassed ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {suite.allPassed
                ? "All calibration scenarios passed."
                : "One or more scenarios need attention."}
            </p>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showOnlyFailures}
                onChange={(event) =>
                  setShowOnlyFailures(event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
              />
              Failures only
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {visibleResults.map((result) => (
              <details
                key={result.id}
                className={`rounded-2xl border p-4 ${
                  result.passed
                    ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                    : "border-red-400/30 bg-red-400/10"
                }`}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start gap-3">
                    {result.passed ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-300"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-red-300"
                      />
                    )}
                    <div>
                      <p className="font-black text-white">
                        {result.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {result.error ? (
                    <p className="text-sm text-red-200">
                      {result.error}
                    </p>
                  ) : (
                    result.assertions.map((assertion) => (
                      <div
                        key={`${result.id}-${assertion.label}`}
                        className="grid gap-1 rounded-xl bg-black/10 p-3 text-sm sm:grid-cols-[1fr_1fr_1fr]"
                      >
                        <span className="font-bold text-slate-300">
                          {assertion.label}
                        </span>
                        <span className="text-slate-400">
                          Expected: {String(assertion.expected)}
                        </span>
                        <span
                          className={
                            assertion.passed
                              ? "text-emerald-300"
                              : "text-red-300"
                          }
                        >
                          Actual: {String(assertion.actual)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </details>
            ))}

            {visibleResults.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-slate-400">
                No failed scenarios.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default RecommendationScenarioRunner;
