import classifyAppError from "./classifyAppError";

const MESSAGES = {
  offline: "You appear to be offline. Reconnect and try again.",
  authentication: "Your session has expired. Sign in again to continue.",
  permission: "You do not have permission to complete this action.",
  rate_limit: "Too many requests were made. Wait a moment and try again.",
  weather: "Weather information is temporarily unavailable. Try again shortly.",
  ai: "Automatic jacket analysis is temporarily unavailable. Retry or enter the details manually.",
  storage: "Jacket images are temporarily unavailable. Try again shortly.",
  database: "Your data could not be loaded right now. Try again shortly.",
  validation: "Check the information you entered and try again.",
  unexpected: "Something unexpected happened. Your data was not changed.",
};

export function safeClientError(error, fallback = "") {
  const type = classifyAppError(error);
  return {
    type,
    message: fallback || MESSAGES[type],
    retryable: !["permission", "validation"].includes(type),
    status: Number(error?.status || error?.context?.status || 0) || null,
  };
}

export default safeClientError;
