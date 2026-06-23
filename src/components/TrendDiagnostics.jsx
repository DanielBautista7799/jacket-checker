import { Database, Sparkles, TrendingUp } from "lucide-react";

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
      {children}
    </span>
  );
}

export default function TrendDiagnostics({ diagnostics }) {
  const trend = diagnostics?.style?.trend;

  if (!trend) return null;

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
      <div className="flex items-start gap-3">
        <TrendingUp size={21} className="mt-1 shrink-0 text-violet-200" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
            Trend diagnostics
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Trend-aware style adjustment
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{trend.enabled ? "Enabled" : "Disabled"}</Badge>
            <Badge>{trend.influence || "off"}</Badge>
            <Badge>{trend.source || "none"}</Badge>
            <Badge>{trend.season || "unknown season"}</Badge>
            <Badge>{trend.matchedRuleCount || 0} matched</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-violet-100">
                <Sparkles size={16} /> Primary rule
              </div>
              <p className="mt-2 font-black text-white">
                {trend.primaryRule?.name || "No rule selected"}
              </p>
              {trend.primaryRule?.reasons?.length > 0 && (
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {trend.primaryRule.reasons.join(", ")}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-violet-100">
                <Database size={16} /> Rule state
              </div>
              <dl className="mt-2 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-3">
                  <dt>Available</dt>
                  <dd className="font-black text-white">{trend.totalRuleCount || 0}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Active</dt>
                  <dd className="font-black text-white">{trend.activeRuleCount || 0}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Adjustment</dt>
                  <dd className="font-black text-white">
                    {trend.adjustmentApplied ? "Applied" : "None"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
