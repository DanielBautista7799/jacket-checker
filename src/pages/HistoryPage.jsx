import { useState } from "react";

import HistoryCard from "../components/HistoryCard";

import useRecommendationLearning from "../hooks/useRecommendationLearning";
import useWardrobeItems from "../hooks/useWardrobeItems";

const FEEDBACK_WEIGHTS = {
fire: 2,
good: 1,
not_it: -1,
};

function HistoryPage() {
const {
adjustPreferenceScore,
wardrobeError,
} = useWardrobeItems();

const {
history,
feedback,
learningLoading,
learningRefreshing,
learningError,
deleteHistoryItem,
} = useRecommendationLearning();

const [deletingId, setDeletingId] = useState(null);
const [localError, setLocalError] = useState("");

const getFeedback = (historyId) =>
feedback.find(
    (entry) => entry.recommendation_id === historyId
) || null;

const handleDelete = async (historyId) => {
if (deletingId) {
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

const displayedError =
localError || learningError || wardrobeError;

return (
<section>
    <div className="mb-6 flex items-end justify-between gap-4">
    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
        History
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Past recommendations
        </h1>

        <p className="mt-2 text-slate-400">
        Deleting a rated recommendation also reverses its
        preference score.
        </p>
    </div>

    {learningRefreshing && (
        <p className="text-xs font-semibold text-slate-500">
        Syncing…
        </p>
    )}
    </div>

    {displayedError && (
    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {displayedError}
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
