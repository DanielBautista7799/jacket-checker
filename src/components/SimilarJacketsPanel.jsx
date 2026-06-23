import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import { useState } from "react";

import useJacketEmbeddings from "../hooks/useJacketEmbeddings";
import useJacketSimilarity from "../hooks/useJacketSimilarity";
import { getJacketEmbeddingStatusLabel } from "../utils/jacketEmbeddingStatus";
import WardrobeImage from "./WardrobeImage";

function SimilarJacketsPanel({ item }) {
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

    if (result) {
      await loadSimilarity();
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05]">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2 font-black text-sky-100">
          <ScanSearch size={18} />
          Similar jackets
        </span>

        <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
          {getJacketEmbeddingStatusLabel(itemStatus)}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 p-4">
          {itemStatus !== "ready" ? (
            <div>
              <p className="text-sm leading-6 text-slate-400">
                Prepare this jacket for duplicate detection and similar-jacket
                matching. Jacket saving and recommendations still work when
                this optional feature is unavailable.
              </p>

              <button
                type="button"
                onClick={handlePrepare}
                disabled={generating}
                className="mt-3 flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-white transition hover:bg-sky-400 disabled:opacity-50"
              >
                {generating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {generating ? "Preparing..." : "Prepare visual matching"}
              </button>
            </div>
          ) : similarityLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <LoaderCircle size={16} className="animate-spin" />
              Looking for similar jackets...
            </div>
          ) : similarityError ? (
            <div>
              <p className="text-sm text-red-200">{similarityError}</p>
              <button
                type="button"
                onClick={loadSimilarity}
                className="mt-3 text-sm font-black text-sky-300"
              >
                Retry
              </button>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-sm text-slate-400">
              No meaningfully similar jackets were found in your closet.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 4).map((match) => (
                <div
                  key={match.jacketId}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    <WardrobeImage
                      item={match.jacket}
                      alt={`${match.jacket.name} jacket`}
                      className="h-16 w-16 object-cover"
                      fallbackClassName="flex h-16 w-16 items-center justify-center bg-white/5 text-slate-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black text-white">
                      {match.jacket.name}
                    </p>
                    <p className="text-xs font-bold text-sky-200">
                      {match.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {match.reasons.join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SimilarJacketsPanel;
