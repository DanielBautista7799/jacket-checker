import { AlertTriangle, CheckCircle2, CloudRain, Shield, Sparkles, XCircle } from "lucide-react";
import EmptyState from "./ui/EmptyState";

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) {
    return <EmptyState icon={Sparkles} title="Your jacket verdict will appear here" description="The check considers current conditions and forecast changes." />;
  }

  const isYes = recommendation.decision === "YES";
  const forecastAlerts = recommendation.forecastAnalysis?.alerts || [];
  const bringAlongSuggestions = recommendation.forecastAnalysis?.bringAlongSuggestions || [];

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl sm:p-6" aria-labelledby="guest-verdict">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Jacket verdict</p>
          <h2 id="guest-verdict" className={`mt-1 text-5xl font-black tracking-tight sm:text-6xl ${isYes ? "text-sky-300" : "text-emerald-300"}`}>{recommendation.decision}</h2>
        </div>
        <div className={`rounded-2xl p-3 ${isYes ? "bg-sky-500/10 text-sky-300" : "bg-emerald-500/10 text-emerald-300"}`} aria-label={isYes ? "Jacket recommended" : "No jacket needed"}>
          {isYes ? <CheckCircle2 size={32} aria-hidden="true" /> : <XCircle size={32} aria-hidden="true" />}
        </div>
      </div>

      <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-labelledby="current-recommendation">
        <div className="mb-3 flex items-center gap-2 text-slate-400"><Shield size={17} aria-hidden="true" /><h3 id="current-recommendation" className="text-sm font-bold uppercase tracking-wide">Current recommendation</h3></div>
        <p className="text-2xl font-black text-white">{recommendation.primaryItem}</p>
        <p className="mt-3 leading-6 text-slate-300">{recommendation.summary}</p>
      </section>

      {bringAlongSuggestions.length > 0 && (
        <section className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5" aria-labelledby="bring-along-title">
          <div className="mb-3 flex items-center gap-2 text-amber-200"><AlertTriangle size={18} aria-hidden="true" /><h3 id="bring-along-title" className="font-black">Bring along</h3></div>
          <div className="space-y-3">{bringAlongSuggestions.map((suggestion, index) => <div key={`${suggestion.item}-${index}`}><p className="font-bold text-white">{suggestion.item}</p><p className="mt-1 text-sm leading-5 text-slate-300">{suggestion.reason}</p></div>)}</div>
        </section>
      )}

      {forecastAlerts.length > 0 && (
        <section className="mb-5 rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5" aria-labelledby="forecast-watch-title">
          <div className="mb-3 flex items-center gap-2 text-sky-200"><CloudRain size={18} aria-hidden="true" /><h3 id="forecast-watch-title" className="font-black">Forecast watch</h3></div>
          <ul className="space-y-2 text-sm leading-5 text-slate-300">{forecastAlerts.map((alert, index) => <li key={`${alert.type}-${index}`}>• {alert.message}</li>)}</ul>
        </section>
      )}

      {recommendation.reasons?.length > 0 && <section className="rounded-3xl bg-white/[0.03] p-5" aria-labelledby="verdict-reasons"><h3 id="verdict-reasons" className="mb-3 font-black text-white">Why?</h3><ul className="space-y-2 text-sm leading-5 text-slate-300">{recommendation.reasons.map((reason, index) => <li key={`${reason}-${index}`}>• {reason}</li>)}</ul></section>}
    </article>
  );
}
