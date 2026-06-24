const RULES = [
  ["offline", /offline|network request failed|failed to fetch|networkerror/i],
  ["authentication", /jwt|session|not authenticated|sign in|auth/i],
  ["permission", /permission|forbidden|row-level security|rls|unauthorized/i],
  ["rate_limit", /429|rate limit|too many requests/i],
  ["weather", /weather|forecast|location search/i],
  ["ai", /gemini|openai|analysis|model|provider overload/i],
  ["storage", /storage|upload|signed url|object not found/i],
  ["database", /postgres|database|supabase|relation|column/i],
  ["validation", /invalid|required|unsupported|too large|too small/i],
];

export function classifyAppError(error) {
  const status = Number(error?.status || error?.context?.status || 0);
  const message = String(error?.message || error?.error_description || error || "");
  if (status === 401) return "authentication";
  if (status === 403) return "permission";
  if (status === 429) return "rate_limit";
  return RULES.find(([, pattern]) => pattern.test(message))?.[0] || "unexpected";
}

export default classifyAppError;
