import { useMemo, useState } from "react";
import { BrainCircuit, RotateCcw } from "lucide-react";

import HistoryCard from "../components/HistoryCard";

import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useWardrobeItems from "../hooks/useWardrobeItems";
import { FEEDBACK_WEIGHTS } from "../utils/feedbackLearning";

function getHistoryWardrobeItemId(entry) {
  return entry?.wardrobe_item_id || entry?.closet_item_id || null;
}

function HistoryPage() {
  const {
    wardrobeItems,
    wardrobeLoading,
    adjustPreferenceScore,
    wardrobeError,
  } = useWardrobeItems();

  const {
    history,
    feedback,
    learningLoading,
    learningRefreshing,
    learningError,
    resettingLearning,
    deleteHistoryItem,
    resetRecommendationLearning,
  } = useRecommendationLearning();

  const [deletingId, setDeletingId] = useState(null);
  const [localError, setLocalError] = useState("");
  const [localMessage, setLocalMessage] = useState("");

  const wardrobeItemById = useMemo(
    () =>
      new Map(
        wardrobeItems.map((item) => [item.id, item])
      ),
    [wardrobeItems]
  );

  const getFeedback = (historyId) =>
    feedback.find(
      (entry) => entry.recommendation_id === historyId
    ) || null;

  const getWardrobeItem = (historyEntry) => {
    const itemId = getHistoryWardrobeItemId(historyEntry);

    return itemId ? wardrobeItemById.get(itemId) || null : null;
  };

  const handleDelete = async (historyId) => {
    if (deletingId || resettingLearning) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this recommendation from history and reverse its preference score?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(historyId);
    setLocalError("");
    setLocalMessage("");

    const historyEntry = history.find(
      (entry) => entry.id === historyId
    );

    const feedbackEntry = getFeedback(historyId);

    const scoreWeight =
      FEEDBACK_WEIGHTS[feedbackEntry?.rating] || 0;

    const wardrobeItemId =
      feedbackEntry?.wardrobe_item_id ||
      feedbackEntry?.closet_item_id ||
      historyEntry?.wardrobe_item_id ||
      historyEntry?.closet_item_id ||
      null;

    let preferenceReversed = false;

    try {
      if (wardrobeItemId && scoreWeight !== 0) {
        preferenceReversed = await adjustPreferenceScore(
          wardrobeItemId,
          -scoreWeight
        );

        if (!preferenceReversed) {
          setLocalError(
            "The recommendation was not deleted because its preference score could not be reversed."
          );
          return;
        }
      }

      const deleted = await deleteHistoryItem(historyId);

      if (!deleted) {
        if (preferenceReversed) {
          const restored = await adjustPreferenceScore(
            wardrobeItemId,
            scoreWeight
          );

          if (!restored) {
            setLocalError(
              "The history entry could not be deleted, and its preference score could not be restored automatically."
            );
            return;
          }
        }

        setLocalError(
          "The recommendation could not be deleted."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetLearning = async () => {
    if (resettingLearning || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      "Reset recommendation learning? This clears Fire, Good, and Not It effects and resets hidden jacket preference scores. Your jackets and recommendation history will stay."
    );

    if (!confirmed) {
      return;
    }

    setLocalError("");
    setLocalMessage("");

    const reset = await resetRecommendationLearning();

    if (reset) {
      setLocalMessage(
        "Recommendation learning was reset. Your jackets and history were kept."
      );
    }
  };

  const hasLearning =
    feedback.length > 0 ||
    wardrobeItems.some((item) => {
      const value = Number(
        item?.preference_score ?? item?.times_recommended ?? 0
      );

      return Number.isFinite(value) && value !== 0;
    });

  const displayedError =
    localError || learningError || wardrobeError;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            History
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
            Past recommendations
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Feedback now learns which jackets work in similar weather while keeping protection more important than preference. Deleting a rated recommendation still reverses its direct preference score.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {learningRefreshing && (
            <p className="text-xs font-semibold text-slate-500">
              Syncing…
            </p>
          )}

          <button
            type="button"
            onClick={handleResetLearning}
            disabled={
              resettingLearning ||
              deletingId !== null ||
              !hasLearning
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-400/10 px-4 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resettingLearning ? (
              <RotateCcw size={17} className="animate-spin" />
            ) : (
              <BrainCircuit size={17} />
            )}

            {resettingLearning
              ? "Resetting..."
              : "Reset learning"}
          </button>
        </div>
      </div>

      {displayedError && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {displayedError}
        </div>
      )}

      {localMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          {localMessage}
        </div>
      )}

      {learningLoading && history.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-300">
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
          Rate a personalized recommendation to begin your history.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {history.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              feedback={getFeedback(entry.id)}
              wardrobeItem={getWardrobeItem(entry)}
              wardrobeLoading={
                wardrobeLoading && wardrobeItems.length === 0
              }
              onDelete={handleDelete}
              deleting={deletingId === entry.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HistoryPage;
