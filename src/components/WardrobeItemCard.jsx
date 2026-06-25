import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Heart,
  Images,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { formatWardrobeLabel } from "../data/wardrobeOptions";
import { getJacketEmbeddingStatusLabel } from "../utils/jacketEmbeddingStatus";
import SimilarJacketsPanel from "./SimilarJacketsPanel";
import WardrobeImage from "./WardrobeImage";
import ConfirmDialog from "./ui/ConfirmDialog";
import Badge from "./ui/Badge";

function RatingTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-400/10 bg-white/[0.03] p-3">
      <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</dt>
      <dd className="font-display mt-1 text-lg font-bold text-white">{Number(value) || 1}/5</dd>
    </div>
  );
}

function EmbeddingStatusBadge({ embedding }) {
  const status = embedding?.status || "missing";
  const label = getJacketEmbeddingStatusLabel(status);
  const tone = status === "ready" ? "success" : status === "failed" ? "warning" : status === "processing" || status === "pending" ? "info" : "neutral";
  const Icon = status === "ready" ? CheckCircle2 : status === "failed" ? TriangleAlert : status === "processing" || status === "pending" ? LoaderCircle : RefreshCw;
  return <Badge tone={tone}><Icon size={12} className={status === "processing" || status === "pending" ? "animate-spin" : ""} aria-hidden="true" />{label}</Badge>;
}

export default function WardrobeItemCard({ item, onEdit, onDelete, onToggleFavorite, onArchive, loading = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const subtypeLabel = formatWardrobeLabel(item.subtype || item.type);
  const colorLabel = formatWardrobeLabel(item.primary_color || item.color);
  const imageCount = Number(item.image_count) || item.images?.length || 0;

  return (
    <article className={`storm-card group overflow-hidden rounded-[var(--radius-large)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/24 ${item.archived ? "border-amber-300/24 opacity-85" : ""}`} aria-labelledby={`jacket-${item.id}-title`}>
      <div className="relative h-56 overflow-hidden bg-slate-950/70">
        <WardrobeImage item={item} alt={`${item.name} primary jacket photo`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]" fallbackClassName="flex h-full w-full items-center justify-center bg-white/[0.03] text-slate-600" iconSize={36} showLabel loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent px-4 pb-4 pt-12">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id={`jacket-${item.id}-title`} className="font-display truncate text-xl font-bold text-white">{item.name}</h2>
              <p className="mt-1 text-sm font-bold text-slate-300">{colorLabel} {subtypeLabel}</p>
            </div>
            {imageCount > 0 && <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur"><Images size={13} aria-hidden="true" />{imageCount}</span>}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {item.archived && <Badge tone="warning">Archived</Badge>}
          {item.ai_generated && <Badge tone="purple"><Sparkles size={12} aria-hidden="true" />AI assisted</Badge>}
          <EmbeddingStatusBadge embedding={item.embedding} />
        </div>

        {item.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">{item.description}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
          <RatingTile label="Warmth" value={item.warmth_rating} />
          <RatingTile label="Rain" value={item.rain_rating} />
          <RatingTile label="Wind" value={item.wind_rating} />
          <RatingTile label="Formal" value={item.formality_rating} />
        </dl>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-400/10 pt-4">
          <div className="flex gap-2" aria-label={`Actions for ${item.name}`}>
            <button type="button" onClick={() => onToggleFavorite(item.id)} disabled={loading} aria-pressed={Boolean(item.favorite)} className={`touch-target inline-flex items-center justify-center rounded-xl border transition disabled:opacity-50 ${item.favorite ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-slate-400/12 bg-white/[0.03] text-slate-400 hover:text-rose-200"}`} aria-label={item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}><Heart size={17} fill={item.favorite ? "currentColor" : "none"} aria-hidden="true" /></button>
            <button type="button" onClick={() => onEdit(item)} disabled={loading} className="touch-target inline-flex items-center justify-center rounded-xl border border-cyan-300/14 bg-cyan-400/[0.05] text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50" aria-label={`Edit ${item.name}`}><Pencil size={17} aria-hidden="true" /></button>
            <button type="button" onClick={() => onArchive(item.id, !item.archived)} disabled={loading} className="touch-target inline-flex items-center justify-center rounded-xl border border-amber-300/14 bg-amber-400/[0.05] text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-50" aria-label={item.archived ? `Restore ${item.name}` : `Archive ${item.name}`}>{item.archived ? <ArchiveRestore size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}</button>
          </div>
          <button type="button" onClick={() => setConfirmDelete(true)} disabled={loading} className="touch-target inline-flex items-center justify-center rounded-xl border border-rose-300/14 bg-rose-400/[0.05] text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50" aria-label={`Delete ${item.name}`}><Trash2 size={17} aria-hidden="true" /></button>
        </div>

        {!item.archived && <SimilarJacketsPanel item={item} />}
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); onDelete(item.id); }} title={`Delete ${item.name}?`} description="This permanently removes the jacket, its photos, similarity data, and future recommendation eligibility." confirmLabel="Delete jacket" danger loading={loading} />
    </article>
  );
}
