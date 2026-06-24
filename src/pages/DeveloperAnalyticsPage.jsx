import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, Gauge, RefreshCw, ThumbsUp } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import AnalyticsMetricCard from "../components/AnalyticsMetricCard";
import AnalyticsBarChart from "../components/AnalyticsBarChart";
import AnalyticsTrendTable from "../components/AnalyticsTrendTable";
import AnalyticsErrorTable from "../components/AnalyticsErrorTable";
import AnalyticsDateRangeSelect from "../components/AnalyticsDateRangeSelect";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";

const emptyDashboard = {
  overview: {},
  outcomes: [],
  features: [],
  feedback: [],
  daily: [],
  errors: [],
};

export default function DeveloperAnalyticsPage() {
  const [days, setDays] = useState("7");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = days === "custom"
        ? { from: customFrom, to: customTo }
        : { days: Number(days) };
      const { data, error: functionError } = await supabase.functions.invoke("get-analytics-dashboard", { body });
      if (functionError) throw functionError;
      setDashboard({ ...emptyDashboard, ...(data?.dashboard || data || {}) });
    } catch (loadError) {
      setError(loadError.message || "Could not load the analytics dashboard.");
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, days]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  return (
    <section className="page-enter" aria-labelledby="analytics-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">Developer only</p>
          <h1 id="analytics-title" className="mt-2 text-4xl font-black tracking-tight text-white">Privacy-safe analytics</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Aggregated product usage, reliability, and performance without emails, exact locations, private images, or raw user records.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <AnalyticsDateRangeSelect value={days} onChange={setDays} customFrom={customFrom} customTo={customTo} onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo} />
          <Button type="button" variant="secondary" onClick={loadDashboard} loading={loading}><RefreshCw size={17} />Refresh</Button>
        </div>
      </div>

      {loading && !dashboard.overview?.total_events ? <div className="mt-6"><LoadingState label="Loading analytics dashboard" rows={5} /></div> : error ? <div className="mt-6"><ErrorState message={error} onRetry={loadDashboard} /></div> : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsMetricCard label="Checks" value={dashboard.overview.total_checks || 0} detail={`${dashboard.overview.success_rate || 0}% successful`} icon={Activity} />
            <AnalyticsMetricCard label="Average response" value={`${dashboard.overview.average_duration_ms || 0} ms`} detail="Successful completed checks" icon={Gauge} tone="emerald" />
            <AnalyticsMetricCard label="AI success" value={`${dashboard.overview.ai_success_rate || 0}%`} detail="Jacket analysis completions" icon={Bot} tone="violet" />
            <AnalyticsMetricCard label="Positive feedback" value={`${dashboard.overview.positive_feedback_rate || 0}%`} detail="Fire and Good ratings" icon={ThumbsUp} tone="amber" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsBarChart title="Recommendation outcomes" items={dashboard.outcomes} />
            <AnalyticsBarChart title="Feature usage" items={dashboard.features} />
          </div>
          <AnalyticsTrendTable rows={dashboard.daily} />
          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsBarChart title="Feedback mix" items={dashboard.feedback} />
            <AnalyticsErrorTable rows={dashboard.errors} />
          </div>
        </div>
      )}
    </section>
  );
}
