import {
  CloudRainWind,
  Gauge,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function formatScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number > 0 ? `+${number}` : String(number);
}

function DetailRow({ label, value, emphasis = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={`text-right text-sm font-bold ${
          emphasis ? "text-sky-200" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function RecommendationDecisionBreakdown({ diagnostics }) {
  if (!diagnostics) {
    return null;
  }

  const { weather, decision, overrides, weatherNeeds } =
    diagnostics;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CloudRainWind size={19} className="text-sky-300" />
          <h3 className="font-black text-white">Selected weather</h3>
        </div>

        <DetailRow label="Condition" value={weather.condition} />
        <DetailRow
          label="Feels like"
          value={`${weather.feelsLike}°F`}
        />
        <DetailRow
          label="Window low"
          value={`${weather.lowestFeelsLike}°F`}
        />
        <DetailRow
          label="Rain chance"
          value={`${weather.rainChance}%`}
        />
        <DetailRow
          label="Wind"
          value={`${weather.windSpeed} mph`}
        />
        <DetailRow
          label="Coverage"
          value={weather.forecastCoverage}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Gauge size={19} className="text-purple-300" />
          <h3 className="font-black text-white">YES / NO calculation</h3>
        </div>

        <DetailRow
          label="Base weather score"
          value={formatScore(decision.baseWeatherScore)}
        />
        <DetailRow
          label="Profile modifier"
          value={formatScore(decision.profileModifier)}
        />
        <DetailRow
          label="Final score"
          value={formatScore(decision.finalWeatherScore)}
          emphasis
        />
        <DetailRow
          label="YES starts at"
          value={decision.yesMinimumScore}
        />
        <DetailRow
          label="Final decision"
          value={decision.result}
          emphasis
        />
        <DetailRow
          label="Basis"
          value={String(
            decision.recommendationBasis || "standard"
          ).replaceAll("_", " ")}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserRound size={19} className="text-emerald-300" />
          <h3 className="font-black text-white">Profile effects</h3>
        </div>

        {decision.profileModifierBreakdown.length > 0 ? (
          <div className="space-y-3">
            {decision.profileModifierBreakdown.map((entry) => (
              <div
                key={`${entry.key}-${entry.reason}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-300">
                    {entry.reason}
                  </p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-200">
                    {formatScore(entry.score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            The saved profile did not change this weather score.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={19} className="text-amber-300" />
          <h3 className="font-black text-white">Protection hierarchy</h3>
        </div>

        <DetailRow
          label="Override applied"
          value={overrides.applied ? "Yes" : "No"}
        />
        <DetailRow
          label="Rain required"
          value={overrides.rainRequired ? "Yes" : "No"}
        />
        <DetailRow
          label="Wind required"
          value={overrides.windRequired ? "Yes" : "No"}
        />
        <DetailRow
          label="Warmth need"
          value={weatherNeeds?.warmth ?? "—"}
        />
        <DetailRow
          label="Rain need"
          value={weatherNeeds?.rain ?? "—"}
        />
        <DetailRow
          label="Wind need"
          value={weatherNeeds?.wind ?? "—"}
        />

        {overrides.reason && (
          <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
            {overrides.reason}
          </p>
        )}
      </section>
    </div>
  );
}

export default RecommendationDecisionBreakdown;
