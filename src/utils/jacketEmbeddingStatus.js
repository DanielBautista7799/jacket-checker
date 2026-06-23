export const JACKET_EMBEDDING_STATUSES = Object.freeze({
  MISSING: "missing",
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
  STALE: "stale",
});

export function normalizeJacketEmbeddingStatus(value) {
  const normalized = String(value || "").toLowerCase();

  if (
    Object.values(JACKET_EMBEDDING_STATUSES).includes(normalized)
  ) {
    return normalized;
  }

  return JACKET_EMBEDDING_STATUSES.MISSING;
}

export function getJacketEmbeddingStatusLabel(value) {
  const status = normalizeJacketEmbeddingStatus(value);

  const labels = {
    missing: "Not set up",
    pending: "Waiting",
    processing: "Matching",
    ready: "Visual matching ready",
    failed: "Matching unavailable",
    stale: "Refresh needed",
  };

  return labels[status];
}

export function isEmbeddingCurrent(embedding) {
  return normalizeJacketEmbeddingStatus(embedding?.status) === "ready";
}

export function needsEmbeddingGeneration(embedding) {
  return ["missing", "pending", "failed", "stale"].includes(
    normalizeJacketEmbeddingStatus(embedding?.status)
  );
}
