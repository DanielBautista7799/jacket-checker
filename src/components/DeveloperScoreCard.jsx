import {
  CheckCircle2,
  CircleHelp,
  Gauge,
  Shirt,
} from "lucide-react";

function getConfidenceClasses(level) {
  if (level === "High") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (level === "Medium") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-red-400/30 bg-red-400/10 text-red-200";
}

function DeveloperScoreCard({ recommendation, diagnostics }) {
  if (!recommendation || !diagnostics) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center">
        <CircleHelp size={30} className="mx-auto text-slate-500" />
        <h2 className="mt-4 text-xl font-black text-white">
          No diagnostic run yet
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Select a location and forecast window, then run the real
          recommendation engine. Nothing from this page is saved.
        </p>
      </div>
    );
  }

  const confidence = diagnostics.decision.confidence;
  const selectedJacket = diagnostics.jacketRanking.selectedJacket;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
            Production engine result
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`text-6xl font-black ${
                recommendation.decision === "YES"
                  ? "text-emerald-300"
                  : "text-sky-300"
              }`}
            >
              {recommendation.decision}
            </span>
            <div>
              <p className="font-black text-white">
                {selectedJacket?.name || recommendation.primaryItem}
              </p>
              <p className="text-sm capitalize text-slate-400">
                {String(
                  recommendation.recommendationBasis || "standard"
                ).replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 ${getConfidenceClasses(
            confidence.level
          )}`}
        >
          <div className="flex items-center gap-2">
            <Gauge size={17} />
            <span className="text-xs font-black uppercase tracking-wide">
              {confidence.level} confidence
            </span>
          </div>
          <p className="mt-1 text-2xl font-black">
            {confidence.score}/100
          </p>
        </div>
      </div>

      <p className="mt-4 leading-7 text-slate-300">
        {recommendation.summary}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Final weather score
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {diagnostics.decision.finalWeatherScore}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Eligible jackets
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {diagnostics.jacketRanking.eligibleCount}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Weather context
          </p>
          <p className="mt-1 text-lg font-black capitalize text-white">
            {String(
              diagnostics.weatherNeeds?.context || "not required"
            ).replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-300" />
            <h3 className="font-black text-white">Confidence notes</h3>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-slate-300">
            {confidence.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Shirt size={17} className="text-purple-300" />
            <h3 className="font-black text-white">Style strategy</h3>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            {diagnostics.styleSuggestion?.text ||
              "No style suggestion was produced."}
          </p>
          {diagnostics.styleSuggestion?.colorStrategy && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-purple-300">
              {String(
                diagnostics.styleSuggestion.colorStrategy
              ).replaceAll("_", " ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default DeveloperScoreCard;
