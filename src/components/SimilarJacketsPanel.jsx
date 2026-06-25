import {
  ChevronDown,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import { useState } from "react";

import useJacketEmbeddings from "../hooks/useJacketEmbeddings";
import useJacketSimilarity from "../hooks/useJacketSimilarity";
import { getJacketEmbeddingStatusLabel } from "../utils/jacketEmbeddingStatus";
import WardrobeImage from "./WardrobeImage";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Spinner from "./ui/Spinner";
import { cn } from "../lib/utils";

export default function SimilarJacketsPanel({ item }) {
  const [open, setOpen] = useState(false);
  const {
    matches,
    similarityLoading,
    similarityError,
    embeddingStatus,
    loadSimilarity,
  } = useJacketSimilarity(item.id);
  const {
    embeddingLoadingIds,
    getEffectiveEmbeddingStatus,
    generateEmbedding,
  } = useJacketEmbeddings();

  const itemStatus =
    getEffectiveEmbeddingStatus(item) || embeddingStatus || "missing";
  const generating = embeddingLoadingIds.includes(item.id);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && itemStatus === "ready" && matches.length === 0) {
      await loadSimilarity();
    }
  };

  const handlePrepare = async () => {
    const result = await generateEmbedding(item.id, {
      force: itemStatus === "failed" || itemStatus === "stale",
    });

    if (result) await loadSimilarity();
  };

  return (
    <section className="mt-4 overflow-hidden rounded-[1.15rem] border border-cyan-300/12 bg-cyan-300/[0.035]">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-400/20"
      >
        <span className="flex items-center gap-2.5 font-extrabold text-sky-100">
          <ScanSearch size={18} strokeWidth={2} aria-hidden="true" />
          Similar jackets
        </span>

        <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
          {getJacketEmbeddingStatusLabel(itemStatus)}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-400/10 p-4">
          {itemStatus !== "ready" ? (
            <div className="rounded-2xl border border-slate-400/10 bg-black/10 p-4">
              <p className="text-sm leading-6 text-slate-400">
                Prepare this jacket for duplicate detection and similar-jacket
                matching. Jacket saving and recommendations still work when
                this optional feature is unavailable.
              </p>
              <Button
                type="button"
                onClick={handlePrepare}
                disabled={generating}
                loading={generating}
                size="sm"
                className="mt-3"
              >
                {!generating && <RefreshCw size={16} aria-hidden="true" />}
                {generating ? "Preparing…" : "Prepare visual matching"}
              </Button>
            </div>
          ) : similarityLoading ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-400/10 bg-black/10 p-4 text-sm text-slate-400" role="status">
              <Spinner size={16} />
              Looking for similar jackets…
            </div>
          ) : similarityError ? (
            <div className="rounded-2xl border border-rose-300/16 bg-rose-300/[0.06] p-4">
              <p className="text-sm leading-6 text-rose-100">{similarityError}</p>
              <Button type="button" onClick={loadSimilarity} variant="secondary" size="sm" className="mt-3">
                <RefreshCw size={16} aria-hidden="true" /> Retry
              </Button>
            </div>
          ) : matches.length === 0 ? (
            <p className="rounded-2xl border border-slate-400/10 bg-black/10 p-4 text-sm leading-6 text-slate-400">
              No meaningfully similar jackets were found in your closet.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 4).map((match) => (
                <article
                  key={match.jacketId}
                  className="flex gap-3 rounded-2xl border border-slate-400/10 bg-black/15 p-3 transition hover:border-slate-300/20 hover:bg-white/[0.035]"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-400/10 bg-white/[0.035]">
                    <WardrobeImage
                      item={match.jacket}
                      alt={`${match.jacket.name} jacket`}
                      className="h-16 w-16 object-cover"
                      fallbackClassName="flex h-16 w-16 items-center justify-center bg-white/[0.035] text-slate-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="truncate font-extrabold text-white">
                        {match.jacket.name}
                      </p>
                      <Badge tone="info">{match.label}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {match.reasons.join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
