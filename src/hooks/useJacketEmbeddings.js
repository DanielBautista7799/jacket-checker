import { useCallback, useEffect, useMemo, useState } from "react";

import { VISUAL_INTELLIGENCE_CONFIG } from "../config/visualIntelligenceConfig";
import useWardrobeItems from "./useWardrobeItems";
import {
  getJacketEmbeddingConfiguration,
  previewJacketSimilarity,
  requestJacketEmbedding,
} from "../utils/jacketEmbeddingApi";
import {
  normalizeJacketSimilarityMatches,
} from "../utils/jacketSimilarity";
import { needsEmbeddingGeneration } from "../utils/jacketEmbeddingStatus";

async function runWithConcurrency(items, worker, concurrency) {
  const queue = [...items];
  const results = [];

  async function consume() {
    while (queue.length > 0) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, items.length || 1)) },
      consume
    )
  );

  return results;
}

function useJacketEmbeddings() {
  const {
    wardrobeItems,
    fetchWardrobeItems,
  } = useWardrobeItems();

  const [embeddingLoadingIds, setEmbeddingLoadingIds] = useState([]);
  const [embeddingError, setEmbeddingError] = useState("");
  const [backfillProgress, setBackfillProgress] = useState(null);
  const [embeddingConfiguration, setEmbeddingConfiguration] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getJacketEmbeddingConfiguration()
        .then(setEmbeddingConfiguration)
        .catch(() => {
          // Similarity remains optional when provider configuration is unavailable.
        });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const getEffectiveEmbeddingStatus = useCallback(
    (item) => {
      const status = item?.embedding?.status || "missing";

      if (
        status === "ready" &&
        embeddingConfiguration &&
        (item.embedding?.provider !== embeddingConfiguration.provider ||
          item.embedding?.model !== embeddingConfiguration.model ||
          Number(item.embedding?.dimensions) !==
            Number(embeddingConfiguration.dimensions))
      ) {
        return "stale";
      }

      return status;
    },
    [embeddingConfiguration]
  );

  const setLoading = useCallback((jacketId, loading) => {
    setEmbeddingLoadingIds((current) => {
      if (loading) {
        return current.includes(jacketId)
          ? current
          : [...current, jacketId];
      }

      return current.filter((id) => id !== jacketId);
    });
  }, []);

  const generateEmbedding = useCallback(
    async (jacketId, { force = false, silent = false } = {}) => {
      if (!jacketId) {
        return null;
      }

      setLoading(jacketId, true);
      if (!silent) {
        setEmbeddingError("");
      }

      try {
        const result = await requestJacketEmbedding(jacketId, { force });
        await fetchWardrobeItems({ force: true, silent: true });
        return result;
      } catch (error) {
        if (!silent) {
          setEmbeddingError(
            error.message || "Could not prepare jacket similarity."
          );
        }
        return null;
      } finally {
        setLoading(jacketId, false);
      }
    },
    [fetchWardrobeItems, setLoading]
  );

  const previewDuplicates = useCallback(
    async (jacket, { excludeJacketId = null } = {}) => {
      setEmbeddingError("");

      const hasReadyComparison = wardrobeItems.some(
        (item) =>
          item.id !== excludeJacketId &&
          item.category === "jacket" &&
          getEffectiveEmbeddingStatus(item) === "ready"
      );

      if (!hasReadyComparison) {
        return [];
      }

      try {
        const result = await previewJacketSimilarity(jacket, {
          excludeJacketId,
        });

        return normalizeJacketSimilarityMatches(
          result.matches,
          wardrobeItems
        );
      } catch (error) {
        setEmbeddingError(
          error.message || "Duplicate matching is temporarily unavailable."
        );
        return [];
      }
    },
    [wardrobeItems, getEffectiveEmbeddingStatus]
  );

  const backfillEmbeddings = useCallback(
    async ({ force = false } = {}) => {
      const candidates = wardrobeItems.filter((item) => {
        if (item.category !== "jacket") {
          return false;
        }

        return (
          force ||
          needsEmbeddingGeneration({
            ...item.embedding,
            status: getEffectiveEmbeddingStatus(item),
          })
        );
      });

      if (candidates.length === 0) {
        setBackfillProgress({
          total: 0,
          completed: 0,
          succeeded: 0,
          failed: 0,
          finished: true,
        });
        return [];
      }

      const progress = {
        total: candidates.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
        finished: false,
      };
      setBackfillProgress({ ...progress });
      setEmbeddingError("");

      const results = await runWithConcurrency(
        candidates,
        async (item) => {
          setLoading(item.id, true);

          try {
            const result = await requestJacketEmbedding(item.id, { force });
            progress.succeeded += result ? 1 : 0;
            return { jacketId: item.id, success: Boolean(result) };
          } catch (error) {
            progress.failed += 1;
            return {
              jacketId: item.id,
              success: false,
              error: error.message,
            };
          } finally {
            progress.completed += 1;
            setBackfillProgress({ ...progress });
            setLoading(item.id, false);
          }
        },
        VISUAL_INTELLIGENCE_CONFIG.backfill.concurrency
      );

      progress.finished = true;
      setBackfillProgress({ ...progress });
      await fetchWardrobeItems({ force: true, silent: true });

      if (progress.failed > 0) {
        setEmbeddingError(
          `${progress.failed} jacket${progress.failed === 1 ? "" : "s"} could not be prepared for similarity matching.`
        );
      }

      return results;
    },
    [
      wardrobeItems,
      fetchWardrobeItems,
      setLoading,
      getEffectiveEmbeddingStatus,
    ]
  );

  const embeddingSummary = useMemo(() => {
    const jackets = wardrobeItems.filter(
      (item) => item.category === "jacket"
    );

    return jackets.reduce(
      (summary, item) => {
        const status = getEffectiveEmbeddingStatus(item);
        summary.total += 1;
        summary[status] = (summary[status] || 0) + 1;
        return summary;
      },
      {
        total: 0,
        ready: 0,
        failed: 0,
        stale: 0,
        pending: 0,
        processing: 0,
        missing: 0,
      }
    );
  }, [wardrobeItems, getEffectiveEmbeddingStatus]);

  return {
    embeddingLoadingIds,
    embeddingError,
    clearEmbeddingError: () => setEmbeddingError(""),
    backfillProgress,
    embeddingSummary,
    embeddingConfiguration,
    getEffectiveEmbeddingStatus,
    generateEmbedding,
    previewDuplicates,
    backfillEmbeddings,
  };
}

export default useJacketEmbeddings;
