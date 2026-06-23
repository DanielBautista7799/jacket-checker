import { AlertTriangle, Save, X } from "lucide-react";

import WardrobeImage from "./WardrobeImage";

function DuplicateJacketWarning({
  matches = [],
  onSaveAnyway,
  onCancel,
  loading = false,
}) {
  if (!matches.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 shrink-0 text-amber-200" size={22} />

        <div className="min-w-0 flex-1">
          <p className="font-black text-amber-100">
            This may already be in your jacket closet
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-50/80">
            Visual matching found an existing jacket with a closely related
            color, type, material, or protection profile. Review it before
            saving a second copy.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {matches.slice(0, 2).map((match) => (
          <div
            key={match.jacketId}
            className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
              <WardrobeImage
                item={match.jacket}
                alt={`${match.jacket.name} jacket`}
                className="h-20 w-20 object-cover"
                fallbackClassName="flex h-20 w-20 items-center justify-center bg-white/5 text-slate-600"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-black text-white">
                {match.jacket.name}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                {match.label}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {match.reasons.slice(0, 2).join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveAnyway}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
        >
          <Save size={17} />
          Save anyway
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        >
          <X size={17} />
          Review jacket details
        </button>
      </div>
    </div>
  );
}

export default DuplicateJacketWarning;
