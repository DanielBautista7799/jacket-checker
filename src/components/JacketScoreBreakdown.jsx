import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  Shield,
  XCircle,
} from "lucide-react";

function formatScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number > 0 ? `+${number}` : String(number);
}

function getSafetyClasses(level) {
  if (level === "suitable") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (level === "limited") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-red-400/30 bg-red-400/10 text-red-200";
}

function ScoreChip({ label, value, negative = false }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
      {label}: {negative && Number(value) > 0 ? "−" : ""}
      {negative ? Math.abs(Number(value) || 0) : formatScore(value)}
    </span>
  );
}

function JacketScoreBreakdown({ diagnostics }) {
  if (!diagnostics) {
    return null;
  }

  const ranked = diagnostics.jacketRanking?.ranked || [];
  const excluded = diagnostics.jacketRanking?.excluded || [];
  const selectedReference =
    diagnostics.jacketRanking?.selectedJacket?.reference;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield size={19} className="text-sky-300" />
            <h3 className="font-black text-white">Jacket ranking</h3>
          </div>

          <div className="flex gap-2 text-xs font-semibold text-slate-400">
            <span>{diagnostics.jacketRanking.eligibleCount} eligible</span>
            <span>·</span>
            <span>{diagnostics.jacketRanking.excludedCount} excluded</span>
          </div>
        </div>

        {ranked.length === 0 ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            No eligible owned jackets were available to rank.
          </div>
        ) : (
          <div className="space-y-4">
            {ranked.map((entry) => {
              const selected =
                entry.jacket.reference === selectedReference;

              return (
                <article
                  key={entry.jacket.reference}
                  className={`rounded-3xl border p-4 ${
                    selected
                      ? "border-sky-400/40 bg-sky-400/10"
                      : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-slate-300">
                          #{entry.rank}
                        </span>
                        <h4 className="font-black text-white">
                          {entry.jacket.name}
                        </h4>
                        {selected && (
                          <span className="rounded-full bg-sky-400/20 px-2 py-1 text-xs font-black text-sky-100">
                            Selected
                          </span>
                        )}
                        {entry.jacket.favorite && (
                          <Heart
                            size={15}
                            className="fill-pink-400 text-pink-400"
                          />
                        )}
                      </div>

                      <p className="mt-1 text-sm capitalize text-slate-400">
                        {String(entry.jacket.subtype || "jacket").replaceAll(
                          "_",
                          " "
                        )}
                        {entry.jacket.primaryColor
                          ? ` · ${entry.jacket.primaryColor}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Final score
                      </p>
                      <p className="text-2xl font-black text-white">
                        {entry.finalScore}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getSafetyClasses(
                        entry.safety.level
                      )}`}
                    >
                      {entry.safety.level} weather match
                    </span>
                    <ScoreChip
                      label="Protection"
                      value={entry.breakdown.protectionSubtotal}
                    />
                    <ScoreChip
                      label="Style"
                      value={entry.breakdown.profileStyle}
                    />
                    <ScoreChip
                      label="Feedback"
                      value={entry.breakdown.storedPreference}
                    />
                    <ScoreChip
                      label="Context"
                      value={entry.breakdown.contextualLearning}
                    />
                    <ScoreChip
                      label="Favorite"
                      value={entry.breakdown.favorite}
                    />
                    <ScoreChip
                      label="Recent"
                      value={entry.breakdown.recentUsePenalty}
                      negative
                    />
                    <ScoreChip
                      label="Overkill"
                      value={entry.breakdown.overkillPenalty}
                      negative
                    />
                    <ScoreChip
                      label="Deficit"
                      value={entry.breakdown.protectionDeficitPenalty}
                      negative
                    />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs text-slate-500">Warmth</p>
                      <p className="font-black text-white">
                        {formatScore(entry.breakdown.warmth)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs text-slate-500">Rain</p>
                      <p className="font-black text-white">
                        {formatScore(entry.breakdown.rain)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs text-slate-500">Wind</p>
                      <p className="font-black text-white">
                        {formatScore(entry.breakdown.wind)}
                      </p>
                    </div>
                  </div>

                  {entry.reasons.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {entry.reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                        >
                          {entry.safety.level === "poor" ? (
                            <AlertTriangle
                              size={15}
                              className="mt-1 shrink-0 text-red-300"
                            />
                          ) : (
                            <CheckCircle2
                              size={15}
                              className="mt-1 shrink-0 text-emerald-300"
                            />
                          )}
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {excluded.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <XCircle size={19} className="text-red-300" />
            <h3 className="font-black text-white">Excluded records</h3>
          </div>

          <div className="space-y-3">
            {excluded.map((entry, index) => (
              <div
                key={`${entry.jacket?.reference || "invalid"}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-3"
              >
                <p className="font-bold text-white">
                  {entry.jacket?.name || "Invalid record"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {entry.reason}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                  {entry.reasonCode}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default JacketScoreBreakdown;
