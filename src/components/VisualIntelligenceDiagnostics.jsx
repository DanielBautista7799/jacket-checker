import {
  CheckCircle2,
  CircleOff,
  Database,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function VisualIntelligenceDiagnostics({ diagnostics }) {
  const visual = diagnostics?.visualIntelligence;

  if (!visual) {
    return null;
  }

  const statuses = visual.statusCounts || {};
  const hasAdjustments = visual.rankingAdjustmentCount > 0;

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
      <div className="flex items-start gap-3">
        <ScanSearch className="mt-1 shrink-0 text-cyan-200" size={23} />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            Phase 10 diagnostics
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Visual jacket intelligence
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            This view shows embedding readiness, sanitized similarity metadata,
            and whether near-duplicate alternatives affected ranking. Full
            vectors and private image data are intentionally excluded.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Jackets" value={visual.jacketCount || 0} />
        <Metric label="Embeddings ready" value={statuses.ready || 0} />
        <Metric label="Similarity pairs" value={visual.similarityPairCount || 0} />
        <Metric
          label="Ranking adjustments"
          value={visual.rankingAdjustmentCount || 0}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 font-black text-white">
            <Database size={17} className="text-cyan-200" />
            Embedding state
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Ready", statuses.ready || 0],
              ["Missing", statuses.missing || 0],
              ["Stale", statuses.stale || 0],
              ["Failed", statuses.failed || 0],
              ["Pending", statuses.pending || 0],
              ["Processing", statuses.processing || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.04] p-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-1 font-black text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 text-xs leading-5 text-slate-500">
            <p>
              Provider: {visual.providers?.join(", ") || "Not configured yet"}
            </p>
            <p>Model: {visual.models?.join(", ") || "Not generated yet"}</p>
            <p>Dimensions: {visual.configuredDimensions}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 font-black text-white">
            {hasAdjustments ? (
              <TriangleAlert size={17} className="text-amber-200" />
            ) : visual.similarityPairCount > 0 ? (
              <CheckCircle2 size={17} className="text-emerald-300" />
            ) : (
              <CircleOff size={17} className="text-slate-500" />
            )}
            Recommendation diversity
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {hasAdjustments
              ? "One or more weather-suitable near-duplicate alternatives were moved down so the top choices remain meaningfully different."
              : visual.similarityPairCount > 0
                ? "Similarity data was available, but it did not need to change this ranking."
                : "No ready similarity pairs were available for this diagnostic run."}
          </p>

          <div className="mt-4 space-y-2">
            {(visual.adjustedJackets || []).slice(0, 5).map((entry) => (
              <div
                key={`${entry.reference}-${entry.similarToReference}`}
                className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-xs text-amber-100"
              >
                <p className="font-black">
                  {entry.reference || "Unknown jacket"} adjusted by -{entry.penalty}
                </p>
                <p className="mt-1 text-amber-50/70">
                  Similar to {entry.similarToReference || "another jacket"}
                  {entry.similarity
                    ? ` at ${Math.round(entry.similarity * 100)}% similarity`
                    : ""}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs leading-5 text-slate-500">
            <p>
              Duplicate threshold: {Math.round(
                visual.thresholds.recommendationNearDuplicate * 100
              )}%
            </p>
            <p>
              Alternative penalty: {visual.thresholds.recommendationPenalty}
            </p>
            <p>
              Affected top three: {visual.affectedTopThree ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VisualIntelligenceDiagnostics;
