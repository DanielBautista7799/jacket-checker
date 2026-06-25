import {
  CheckCircle2,
  RefreshCw,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";

import useJacketEmbeddings from "../hooks/useJacketEmbeddings";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Progress from "./ui/Progress";
import TextShimmer from "./ui/TextShimmer";

export default function JacketEmbeddingBackfill() {
  const {
    embeddingSummary,
    embeddingError,
    backfillProgress,
    backfillEmbeddings,
  } = useJacketEmbeddings();

  const ready = embeddingSummary.ready;
  const total = embeddingSummary.total;
  const incomplete = Math.max(0, total - ready);
  const running = Boolean(backfillProgress && !backfillProgress.finished);
  const progressValue = running
    ? Math.round(
        (backfillProgress.completed / Math.max(1, backfillProgress.total)) * 100,
      )
    : total > 0
      ? Math.round((ready / total) * 100)
      : 0;

  if (total === 0) return null;

  return (
    <Card className="mb-6 overflow-hidden border-cyan-300/16 bg-cyan-300/[0.045] p-0">
      <div className="relative p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
              <ScanSearch size={21} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold tracking-[-0.02em] text-white">
                Visual jacket matching
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                {ready} of {total} jacket{total === 1 ? " is" : "s are"} ready
                for duplicate detection and similar-jacket matching.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => backfillEmbeddings()}
            disabled={running || incomplete === 0}
            loading={running}
            variant={incomplete === 0 ? "secondary" : "default"}
            className="shrink-0"
          >
            {!running && (incomplete === 0 ? (
              <CheckCircle2 size={17} aria-hidden="true" />
            ) : (
              <RefreshCw size={17} aria-hidden="true" />
            ))}
            {running
              ? `Preparing ${backfillProgress.completed}/${backfillProgress.total}`
              : incomplete === 0
                ? "Matching ready"
                : `Prepare ${incomplete} jacket${incomplete === 1 ? "" : "s"}`}
          </Button>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            <span>{running ? <TextShimmer>Preparing visual matches…</TextShimmer> : "Readiness"}</span>
            <span className="text-slate-300">{progressValue}%</span>
          </div>
          <Progress value={progressValue} label="Visual matching readiness" />
        </div>

        {embeddingError && (
          <div className="relative mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-300/18 bg-amber-300/[0.08] p-3.5 text-sm leading-6 text-amber-100">
            <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{embeddingError}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
