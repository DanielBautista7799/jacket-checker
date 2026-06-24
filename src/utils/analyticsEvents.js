export function getExperienceMode(pathname, user) {
  if (pathname.startsWith("/dev/")) {
    return "developer";
  }
  return user ? "personalized" : "guest";
}

export function getSafeErrorCode(error) {
  const source = String(
    error?.code || error?.name || error?.message || "unknown_error"
  ).toLowerCase();

  if (source.includes("timeout")) return "timeout";
  if (source.includes("network") || source.includes("fetch")) return "network_error";
  if (source.includes("401") || source.includes("unauthorized")) return "unauthorized";
  if (source.includes("403") || source.includes("forbidden")) return "forbidden";
  if (source.includes("429") || source.includes("rate")) return "rate_limited";
  if (source.includes("weather")) return "weather_error";
  if (source.includes("analysis")) return "analysis_error";
  if (source.includes("embedding")) return "embedding_error";
  return "unknown_error";
}

export function createOperationTimer() {
  const startedAt = performance.now();
  return () => Math.max(0, Math.round(performance.now() - startedAt));
}
