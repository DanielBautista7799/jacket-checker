export default function AnalyticsTrendTable({ rows = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <h2 className="text-lg font-black text-white">Daily activity</h2>
      <p className="mt-1 text-sm text-slate-400">Aggregated checks and successful outcomes by day.</p>
      <div className="mt-5 overflow-x-auto scrollbar-subtle">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Guest</th><th className="px-3 py-3">Personalized</th><th className="px-3 py-3">Success</th><th className="px-3 py-3">Avg. ms</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length ? rows.map((row) => (
              <tr key={row.date}>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-white">{row.date}</td>
                <td className="px-3 py-3 text-slate-300">{row.guest_checks || 0}</td>
                <td className="px-3 py-3 text-slate-300">{row.personalized_checks || 0}</td>
                <td className="px-3 py-3 text-slate-300">{row.success_rate ?? 0}%</td>
                <td className="px-3 py-3 text-slate-300">{row.average_duration_ms || 0}</td>
              </tr>
            )) : <tr><td colSpan="5" className="px-3 py-8 text-center text-slate-500">No daily data in this range.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
