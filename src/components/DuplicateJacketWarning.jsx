import { useEffect, useRef } from "react";
import { AlertTriangle, Save, X } from "lucide-react";

import WardrobeImage from "./WardrobeImage";
import useAnalytics from "../hooks/useAnalytics";
import Button from "./ui/Button";

export default function DuplicateJacketWarning({ matches = [], onSaveAnyway, onCancel, loading = false }) {
  const { track } = useAnalytics();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (matches.length && !trackedRef.current) {
      trackedRef.current = true;
      track("duplicate_warning_shown", {
        experienceMode: "personalized",
        metadata: { match_count: matches.length, strongest_category: matches[0]?.label || "similar" },
      });
    }
    if (!matches.length) trackedRef.current = false;
  }, [matches, track]);

  if (!matches.length) return null;

  return (
    <section role="alert" aria-labelledby="duplicate-warning-title" className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 shrink-0 text-amber-200" size={22} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 id="duplicate-warning-title" className="font-black text-amber-100">This may already be in your jacket closet</h3>
          <p className="mt-1 text-sm leading-6 text-amber-50/80">Visual matching found an existing jacket with a closely related color, type, material, or protection profile. Review it before saving a second copy.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {matches.slice(0, 2).map((match) => (
          <article key={match.jacketId} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
              <WardrobeImage item={match.jacket} alt={`${match.jacket.name} jacket`} className="h-20 w-20 object-cover" fallbackClassName="flex h-20 w-20 items-center justify-center bg-white/5 text-slate-600" loading="lazy" />
            </div>
            <div className="min-w-0">
              <h4 className="truncate font-black text-white">{match.jacket.name}</h4>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-200">{match.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{match.reasons.slice(0, 2).join(" · ")}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={onSaveAnyway} loading={loading} className="bg-amber-300 text-slate-950 hover:bg-amber-200"><Save size={17} aria-hidden="true" />Save anyway</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}><X size={17} aria-hidden="true" />Review jacket details</Button>
      </div>
    </section>
  );
}
