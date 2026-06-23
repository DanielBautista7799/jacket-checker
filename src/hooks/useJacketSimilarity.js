import { useCallback, useState } from "react";

import useWardrobeItems from "./useWardrobeItems";
import { requestJacketSimilarity } from "../utils/jacketEmbeddingApi";
import { normalizeJacketSimilarityMatches } from "../utils/jacketSimilarity";

function useJacketSimilarity(jacketId, { enabled = false } = {}) {
  const { wardrobeItems } = useWardrobeItems();
  const [matches, setMatches] = useState([]);
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [similarityError, setSimilarityError] = useState("");
  const [embeddingStatus, setEmbeddingStatus] = useState(null);

  const loadSimilarity = useCallback(async () => {
    if (!jacketId) {
      setMatches([]);
      return [];
    }

    setSimilarityLoading(true);
    setSimilarityError("");

    try {
      const result = await requestJacketSimilarity(jacketId);
      const normalized = normalizeJacketSimilarityMatches(
        result.matches,
        wardrobeItems
      );
      setMatches(normalized);
      setEmbeddingStatus(result.status || null);
      return normalized;
    } catch (error) {
      setMatches([]);
      setSimilarityError(
        error.message || "Similar jackets are temporarily unavailable."
      );
      return [];
    } finally {
      setSimilarityLoading(false);
    }
  }, [jacketId, wardrobeItems]);

  void enabled;

  return {
    matches,
    similarityLoading,
    similarityError,
    embeddingStatus,
    loadSimilarity,
  };
}

export default useJacketSimilarity;
