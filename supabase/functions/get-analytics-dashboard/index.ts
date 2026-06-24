import { createServiceClient } from "../_shared/security/auth.ts";
import { requireDeveloper } from "../_shared/security/adminAccess.ts";
import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

Deno.serve(async (request: Request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    if (request.method !== "POST") throw new SafeHttpError(405, "method_not_allowed", "POST is required.");

    const { user } = await requireDeveloper(request);
    await enforceRateLimit({ request, functionName: "get-analytics-dashboard", userId: user.id, limit: 120, windowSeconds: 3600 });
    const body = await readJsonBody<Record<string, unknown>>(request, 16 * 1024);
    const days = Math.min(90, Math.max(1, Math.round(Number(body.days) || 7)));
    let fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let toDate = new Date();

    if (body.from && body.to) {
      fromDate = new Date(String(body.from));
      toDate = new Date(String(body.to));
      toDate.setUTCHours(23, 59, 59, 999);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
        throw new SafeHttpError(400, "invalid_date_range", "The custom analytics date range is invalid.");
      }
      if (toDate.getTime() - fromDate.getTime() > 90 * 24 * 60 * 60 * 1000) {
        throw new SafeHttpError(400, "date_range_too_large", "Analytics date ranges cannot exceed 90 days.");
      }
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("analytics_events")
      .select("event_name, experience_mode, success, duration_ms, metadata, created_at")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: true })
      .limit(20000);
    if (error) throw new SafeHttpError(503, "analytics_query_failed", "Analytics could not be loaded.");

    const events = data || [];
    const completed = events.filter((event) => ["guest_check_completed", "personalized_check_completed"].includes(event.event_name));
    const failed = events.filter((event) => ["guest_check_failed", "personalized_check_failed"].includes(event.event_name));
    const timed = completed.filter((event) => Number.isFinite(Number(event.duration_ms)));
    const aiDone = events.filter((event) => event.event_name === "jacket_ai_analysis_completed").length;
    const aiFailed = events.filter((event) => event.event_name === "jacket_ai_analysis_failed").length;
    const positiveFeedback = events.filter((event) => event.event_name === "jacket_feedback_submitted" && ["fire", "good"].includes(String(event.metadata?.feedback_type || ""))).length;
    const allFeedback = events.filter((event) => event.event_name === "jacket_feedback_submitted").length;
    const count = (name: string) => events.filter((event) => event.event_name === name).length;

    const outcomes = [
      { label: "YES", value: completed.filter((event) => event.metadata?.decision === "YES").length },
      { label: "NO", value: completed.filter((event) => event.metadata?.decision === "NO").length },
      { label: "Failed", value: failed.length },
    ];
    const features = [
      ["AI analyses", "jacket_ai_analysis_completed"],
      ["Alternate jackets", "alternate_jacket_selected"],
      ["Duplicate warnings", "duplicate_warning_shown"],
      ["Similar jackets", "similar_jackets_opened"],
      ["Trend feedback", "trend_feedback_submitted"],
    ].map(([label, name]) => ({ label, value: count(name) }));
    const feedback = ["fire", "good", "not_it"].map((rating) => ({
      label: rating === "not_it" ? "Not It" : `${rating[0].toUpperCase()}${rating.slice(1)}`,
      value: events.filter((event) => event.event_name === "jacket_feedback_submitted" && event.metadata?.feedback_type === rating).length,
    }));

    const dailyMap = new Map<string, Record<string, number | string>>();
    for (const event of events) {
      const date = String(event.created_at).slice(0, 10);
      const current = dailyMap.get(date) || { date, guest_checks: 0, personalized_checks: 0, successes: 0, total: 0, duration_total: 0, duration_count: 0 };
      if (event.event_name === "guest_check_completed") current.guest_checks = Number(current.guest_checks) + 1;
      if (event.event_name === "personalized_check_completed") current.personalized_checks = Number(current.personalized_checks) + 1;
      if (["guest_check_completed", "personalized_check_completed", "guest_check_failed", "personalized_check_failed"].includes(event.event_name)) current.total = Number(current.total) + 1;
      if (["guest_check_completed", "personalized_check_completed"].includes(event.event_name)) current.successes = Number(current.successes) + 1;
      if (event.duration_ms !== null && event.duration_ms !== undefined) {
        current.duration_total = Number(current.duration_total) + Number(event.duration_ms);
        current.duration_count = Number(current.duration_count) + 1;
      }
      dailyMap.set(date, current);
    }
    const daily = [...dailyMap.values()].map((row) => ({
      date: row.date,
      guest_checks: row.guest_checks,
      personalized_checks: row.personalized_checks,
      success_rate: percent(Number(row.successes), Number(row.total)),
      average_duration_ms: Number(row.duration_count) ? Math.round(Number(row.duration_total) / Number(row.duration_count)) : 0,
    })).slice(-31).reverse();

    const errorMap = new Map<string, { code: string; count: number; last_seen: string }>();
    for (const event of events.filter((entry) => entry.success === false || entry.event_name.endsWith("_failed") || entry.event_name.includes("error"))) {
      const code = String(event.metadata?.error_code || event.event_name || "unknown_error").slice(0, 80);
      const previous = errorMap.get(code) || { code, count: 0, last_seen: "" };
      previous.count += 1;
      previous.last_seen = String(event.created_at).slice(0, 10);
      errorMap.set(code, previous);
    }

    return jsonResponse(request, { dashboard: {
      overview: {
        total_events: events.length,
        total_checks: completed.length + failed.length,
        success_rate: percent(completed.length, completed.length + failed.length),
        average_duration_ms: timed.length ? Math.round(timed.reduce((sum, event) => sum + Number(event.duration_ms), 0) / timed.length) : 0,
        ai_success_rate: percent(aiDone, aiDone + aiFailed),
        positive_feedback_rate: percent(positiveFeedback, allFeedback),
      },
      outcomes,
      features,
      feedback,
      daily,
      errors: [...errorMap.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    } }, 200, requestId);
  } catch (error) {
    return safeErrorResponse(request, error, requestId);
  }
});
