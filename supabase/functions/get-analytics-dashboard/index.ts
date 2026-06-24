import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function parseCsv(value: string | undefined) {
  return new Set(String(value || "").split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean));
}

async function requireDeveloper(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("Supabase server configuration is incomplete.");

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Authentication is required.");
  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error("The authenticated user could not be verified.");

  const allowedIds = new Set([...parseCsv(Deno.env.get("DEVELOPER_USER_IDS")), ...parseCsv(Deno.env.get("TREND_ADMIN_USER_IDS"))]);
  const allowedEmails = new Set([...parseCsv(Deno.env.get("DEVELOPER_EMAILS")), ...parseCsv(Deno.env.get("TREND_ADMIN_EMAILS"))]);
  if (!allowedIds.has(data.user.id.toLowerCase()) && !allowedEmails.has(String(data.user.email || "").toLowerCase())) {
    throw new Error("Developer analytics are not enabled for this account.");
  }

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: { code: "method_not_allowed", message: "POST is required." } }, 405);

  try {
    const service = await requireDeveloper(request);
    const body = await request.json().catch(() => ({}));
    const days = Math.min(90, Math.max(1, Math.round(Number(body?.days) || 7)));
    let fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let toDate = new Date();

    if (body?.from && body?.to) {
      fromDate = new Date(String(body.from));
      toDate = new Date(String(body.to));
      toDate.setUTCHours(23, 59, 59, 999);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
        throw new Error("The custom analytics date range is invalid.");
      }
      if (toDate.getTime() - fromDate.getTime() > 90 * 24 * 60 * 60 * 1000) {
        throw new Error("Analytics date ranges cannot exceed 90 days.");
      }
    }

    const from = fromDate.toISOString();
    const to = toDate.toISOString();
    const { data, error } = await service
      .from("analytics_events")
      .select("event_name, experience_mode, success, duration_ms, metadata, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })
      .limit(20000);
    if (error) throw error;

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
    const featureNames = [
      ["AI analyses", "jacket_ai_analysis_completed"],
      ["Alternate jackets", "alternate_jacket_selected"],
      ["Duplicate warnings", "duplicate_warning_shown"],
      ["Similar jackets", "similar_jackets_opened"],
      ["Trend feedback", "trend_feedback_submitted"],
    ];
    const features = featureNames.map(([label, name]) => ({ label, value: count(name) }));
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

    return json({ dashboard: {
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
    } });
  } catch (error) {
    console.error("Analytics dashboard request rejected:", { message: error instanceof Error ? error.message : "Unknown error" });
    const message = error instanceof Error ? error.message : "Analytics dashboard request failed.";
    return json({ error: { code: message.includes("enabled") ? "forbidden" : "dashboard_error", message } }, message.includes("enabled") ? 403 : 400);
  }
});
