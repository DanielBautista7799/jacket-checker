import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";

import useJacketEmbeddings from "../hooks/useJacketEmbeddings";

function JacketEmbeddingBackfill() {
  const {
    embeddingSummary,
    embeddingError,
    backfillProgress,
    backfillEmbeddings,
  } = useJacketEmbeddings();

  const ready = embeddingSummary.ready;
  const total = embeddingSummary.total;
  const incomplete = Math.max(0, total - ready);
  const running = Boolean(
    backfillProgress && !backfillProgress.finished
  );

  if (total === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.07] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <ScanSearch className="mt-1 shrink-0 text-cyan-200" size={22} />
          <div>
            <p className="font-black text-cyan-100">
              Visual jacket matching
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {ready} of {total} jacket{total === 1 ? " is" : "s are"} ready
              for duplicate detection and similar-jacket matching.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => backfillEmbeddings()}
          disabled={running || incomplete === 0}
          className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {running ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : incomplete === 0 ? (
            <CheckCircle2 size={17} />
          ) : (
            <RefreshCw size={17} />
          )}
          {running
            ? `Preparing ${backfillProgress.completed}/${backfillProgress.total}`
            : incomplete === 0
              ? "Matching ready"
              : `Prepare ${incomplete} jacket${incomplete === 1 ? "" : "s"}`}
        </button>
      </div>

      {running && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-cyan-300 transition-all"
            style={{
              width: `${Math.round(
                (backfillProgress.completed /
                  Math.max(1, backfillProgress.total)) *
                  100
              )}%`,
            }}
          />
        </div>
      )}

      {embeddingError && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" />
          {embeddingError}
        </div>
      )}
    </div>
  );
}

export default JacketEmbeddingBackfill;
