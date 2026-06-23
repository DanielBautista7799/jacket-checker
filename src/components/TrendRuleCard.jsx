import { CalendarDays, Edit3, Power, PowerOff, Tags } from "lucide-react";

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString();
}

function statusForRule(rule) {
  const now = Date.now();
  const starts = rule.starts_at ? new Date(rule.starts_at).getTime() : null;
  const expires = rule.expires_at ? new Date(rule.expires_at).getTime() : null;

  if (!rule.is_active) return "Inactive";
  if (starts && starts > now) return "Upcoming";
  if (expires && expires < now) return "Expired";
  return "Active";
}

export default function TrendRuleCard({ rule, onEdit, onToggle, busy = false }) {
  const status = statusForRule(rule);
  const statusClass =
    status === "Active"
      ? "bg-emerald-400/15 text-emerald-200"
      : status === "Upcoming"
        ? "bg-sky-400/15 text-sky-200"
        : status === "Expired"
          ? "bg-amber-400/15 text-amber-200"
          : "bg-slate-400/15 text-slate-300";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-white">{rule.name}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass}`}>
              {status}
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-violet-300">{rule.slug}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {rule.description || "No description."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarDays size={15} /> Dates
          </div>
          <p className="mt-1 font-bold text-white">
            {formatDate(rule.starts_at)} – {formatDate(rule.expires_at)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Tags size={15} /> Matches
          </div>
          <p className="mt-1 capitalize text-white">
            {[...(rule.style_tags || []), ...(rule.seasons || [])].slice(0, 5).join(", ") || "General"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEdit?.(rule)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-white transition hover:bg-white/[0.08]"
        >
          <Edit3 size={15} /> Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle?.(rule)}
          className="flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-sm font-black text-violet-100 transition hover:bg-violet-400/20 disabled:opacity-50"
        >
          {rule.is_active ? <PowerOff size={15} /> : <Power size={15} />}
          {rule.is_active ? "Disable" : "Enable"}
        </button>
      </div>
    </article>
  );
}
