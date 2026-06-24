export default function AnalyticsBarChart({ title, description, items = [], valueFormatter = (value) => value }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));
  return (
    <section aria-labelledby={`${title}-chart-title`} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <h2 id={`${title}-chart-title`} className="text-lg font-black text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      <div className="mt-5 space-y-4">
        {items.length ? items.map((item) => {
          const value = Number(item.value) || 0;
          const width = `${Math.max(value > 0 ? 4 : 0, (value / max) * 100)}%`;
          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-bold text-slate-200">{item.label}</span>
                <span className="text-slate-400">{valueFormatter(value)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                <div className="h-full rounded-full bg-sky-400" style={{ width }} />
              </div>
            </div>
          );
        }) : <p className="text-sm text-slate-500">No events were recorded in this range.</p>}
      </div>
    </section>
  );
}
