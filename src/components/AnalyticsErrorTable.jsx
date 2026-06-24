import Badge from "./ui/Badge";

export default function AnalyticsErrorTable({ rows = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <h2 className="text-lg font-black text-white">Safe error categories</h2>
      <p className="mt-1 text-sm text-slate-400">Only aggregated error codes are shown. Stack traces and private values are excluded.</p>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row) => (
          <div key={row.code} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div><p className="font-bold text-white">{String(row.code || "unknown_error").replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{row.last_seen ? `Last seen ${row.last_seen}` : "Aggregated category"}</p></div>
            <Badge tone={row.count > 10 ? "danger" : "warning"}>{row.count || 0} events</Badge>
          </div>
        )) : <p className="text-sm text-slate-500">No errors were recorded in this range.</p>}
      </div>
    </section>
  );
}
