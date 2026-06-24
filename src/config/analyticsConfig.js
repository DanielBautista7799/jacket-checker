export const ANALYTICS_STORAGE_KEY = "jacket-check:analytics-session:v1";
export const ANALYTICS_CONSENT_KEY = "jacket-check:analytics-enabled:v1";
export const ANALYTICS_BATCH_SIZE = 12;
export const ANALYTICS_FLUSH_INTERVAL_MS = 4000;
export const ANALYTICS_FAILURE_LIMIT = 3;
export const ANALYTICS_MAX_METADATA_KEYS = 12;
export const ANALYTICS_MAX_STRING_LENGTH = 120;

export const ANALYTICS_EVENT_NAMES = Object.freeze([
  "guest_page_view",
  "guest_location_search",
  "guest_browser_location",
  "guest_forecast_window_changed",
  "guest_check_started",
  "guest_check_completed",
  "guest_check_failed",
  "personalized_page_view",
  "personalized_location_search",
  "personalized_browser_location",
  "personalized_forecast_window_changed",
  "personalized_check_started",
  "personalized_check_completed",
  "personalized_check_failed",
  "alternate_jacket_selected",
  "jacket_created",
  "jacket_updated",
  "jacket_archived",
  "jacket_restored",
  "jacket_deleted",
  "jacket_image_added",
  "jacket_primary_image_changed",
  "jacket_ai_analysis_started",
  "jacket_ai_analysis_completed",
  "jacket_ai_analysis_failed",
  "jacket_embedding_completed",
  "jacket_embedding_failed",
  "duplicate_warning_shown",
  "similar_jackets_opened",
  "jacket_feedback_submitted",
  "jacket_feedback_changed",
  "trend_feedback_submitted",
  "learning_reset",
  "history_entry_deleted",
  "weather_cache_hit",
  "weather_cache_miss",
  "signed_image_cache_refresh",
  "edge_function_error",
  "route_error",
  "unexpected_ui_error",
  "developer_page_view",
]);

export const ANALYTICS_EVENT_SET = new Set(ANALYTICS_EVENT_NAMES);

export const ROUTE_EVENT_MAP = Object.freeze({
  "/": "guest_page_view",
  "/app": "personalized_page_view",
  "/dev/scoring": "developer_page_view",
  "/dev/trends": "developer_page_view",
  "/dev/analytics": "developer_page_view",
});
