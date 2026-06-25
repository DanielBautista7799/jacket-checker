import { useMemo, useState } from "react";
import { BrainCircuit, History as HistoryIcon, RotateCcw } from "lucide-react";

import HistoryCard from "../components/HistoryCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import useAnalytics from "../hooks/useAnalytics";
import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useWardrobeItems from "../hooks/useWardrobeItems";
import { FEEDBACK_WEIGHTS } from "../utils/feedbackLearning";

function getHistoryWardrobeItemId(entry) {
  return entry?.wardrobe_item_id || entry?.closet_item_id || null;
}

export default function HistoryPage() {
  const { track } = useAnalytics();
  const { wardrobeItems, wardrobeLoading, adjustPreferenceScore, wardrobeError } = useWardrobeItems();
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [localError, setLocalError] = useState("");
  const [localMessage, setLocalMessage] = useState("");

  const wardrobeItemById = useMemo(() => new Map(wardrobeItems.map((item) => [item.id, item])), [wardrobeItems]);
  const getFeedback = (historyId) => feedback.find((entry) => entry.recommendation_id === historyId) || null;
  const getWardrobeItem = (historyEntry) => {
    const itemId = getHistoryWardrobeItemId(historyEntry);
    return itemId ? wardrobeItemById.get(itemId) || null : null;
  };

  const handleDelete = async () => {
    const historyId = confirmDeleteId;
    if (!historyId || deletingId || resettingLearning) return;

    setConfirmDeleteId(null);
    setDeletingId(historyId);
    setLocalError("");
    setLocalMessage("");

    const historyEntry = history.find((entry) => entry.id === historyId);
    const feedbackEntry = getFeedback(historyId);
    const scoreWeight = FEEDBACK_WEIGHTS[feedbackEntry?.rating] || 0;
    const wardrobeItemId = feedbackEntry?.wardrobe_item_id || feedbackEntry?.closet_item_id || historyEntry?.wardrobe_item_id || historyEntry?.closet_item_id || null;
    let preferenceReversed = false;

    try {
      if (wardrobeItemId && scoreWeight !== 0) {
        preferenceReversed = await adjustPreferenceScore(wardrobeItemId, -scoreWeight);
        if (!preferenceReversed) {
          setLocalError("The recommendation was not deleted because its preference score could not be reversed.");
          return;
        }
      }

      const deleted = await deleteHistoryItem(historyId);
      if (!deleted) {
        if (preferenceReversed) await adjustPreferenceScore(wardrobeItemId, scoreWeight);
        setLocalError("The recommendation could not be deleted.");
        return;
      }

      track("history_entry_deleted", {
        experienceMode: "personalized",
        metadata: { had_feedback: Boolean(feedbackEntry), score_reversed: preferenceReversed },
      });
      setLocalMessage("Recommendation deleted. Any saved feedback effect was reversed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetLearning = async () => {
    if (resettingLearning || deletingId) return;
    setConfirmReset(false);
    setLocalError("");
    setLocalMessage("");
    const reset = await resetRecommendationLearning();
    if (reset) {
      track("learning_reset", { experienceMode: "personalized", metadata: { history_kept: true, jackets_kept: true } });
      setLocalMessage("Recommendation learning was reset. Your jackets and history were kept.");
    }
  };

  const hasLearning = feedback.length > 0 || wardrobeItems.some((item) => {
    const value = Number(item?.preference_score ?? item?.times_recommended ?? 0);
    return Number.isFinite(value) && value !== 0;
  });
  const displayedError = localError || learningError || wardrobeError;
  const visibleHistory = history.slice(0, visibleCount);
  const groupedHistory = useMemo(() => {
    const groups = new Map();
    visibleHistory.forEach((entry) => {
      const date = entry.created_at ? new Date(entry.created_at) : null;
      const key = !date || Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    return [...groups.entries()];
  }, [visibleHistory]);

  return (
    <section className="page-enter" aria-labelledby="history-title">
      <PageHeader
        eyebrow="History"
        title="Past recommendations"
        description="Review previous checks, saved style ideas, and feedback. Deleting a rated result reverses its direct learning effect."
        actions={
          <div className="flex items-center gap-3">
            {learningRefreshing && <p role="status" className="text-xs font-extrabold text-slate-500">Syncing history…</p>}
            <Button type="button" variant="secondary" onClick={() => setConfirmReset(true)} disabled={resettingLearning || deletingId !== null || !hasLearning} loading={resettingLearning}>
              {resettingLearning ? <RotateCcw size={17} className="animate-spin" aria-hidden="true" /> : <BrainCircuit size={17} aria-hidden="true" />}
              Reset learning
            </Button>
          </div>
        }
        className="mb-6"
      />

      {displayedError && <div className="mb-5"><Alert tone="error">{displayedError}</Alert></div>}
      {localMessage && <div className="mb-5"><Alert tone="success">{localMessage}</Alert></div>}

      {learningLoading && history.length === 0 ? (
        <LoadingState label="Loading recommendation history" rows={5} />
      ) : history.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No recommendation history yet" description="Run a personalized check and rate a jacket to begin building your history." />
      ) : (
        <>
          <div className="space-y-7">
            {groupedHistory.map(([dateLabel, entries]) => (
              <section key={dateLabel} aria-labelledby={`history-date-${dateLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}>
                <h2 id={`history-date-${dateLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{dateLabel}</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {entries.map((entry) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      feedback={getFeedback(entry.id)}
                      wardrobeItem={getWardrobeItem(entry)}
                      wardrobeLoading={wardrobeLoading && wardrobeItems.length === 0}
                      onDelete={() => setConfirmDeleteId(entry.id)}
                      deleting={deletingId === entry.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
          {visibleCount < history.length && (
            <div className="mt-6 text-center">
              <Button type="button" variant="secondary" onClick={() => setVisibleCount((count) => count + 12)}>Load more history</Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this recommendation?"
        description="The history entry will be removed and any direct Fire, Good, or Not It score will be reversed."
        confirmLabel="Delete recommendation"
        danger
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetLearning}
        title="Reset recommendation learning?"
        description="This clears Fire, Good, and Not It effects and hidden jacket preference scores. Your jackets and history stay."
        confirmLabel="Reset learning"
        loading={resettingLearning}
      />
    </section>
  );
}
