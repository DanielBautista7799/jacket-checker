import Card from "./ui/Card";

export default function AnalyticsMetricCard({ label, value, detail, icon: Icon, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-400/10 text-sky-200",
    emerald: "bg-emerald-400/10 text-emerald-200",
    violet: "bg-violet-400/10 text-violet-200",
    amber: "bg-amber-400/10 text-amber-200",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
          {detail && <p className="mt-2 text-sm text-slate-400">{detail}</p>}
        </div>
        {Icon && <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.sky}`}><Icon size={21} aria-hidden="true" /></span>}
      </div>
    </Card>
  );
}
