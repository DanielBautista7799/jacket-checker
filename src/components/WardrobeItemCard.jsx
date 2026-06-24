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
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-black text-white">{Number(value) || 1}/5</dd>
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
  const categoryLabel = formatWardrobeLabel(item.category);
  const subtypeLabel = formatWardrobeLabel(item.subtype || item.type);
  const colorLabel = formatWardrobeLabel(item.primary_color || item.color);
  const imageCount = Number(item.image_count) || item.images?.length || 0;

  return (
    <article className={`overflow-hidden rounded-3xl border bg-slate-950/60 shadow-lg ${item.archived ? "border-amber-400/25 opacity-85" : "border-white/10"}`} aria-labelledby={`jacket-${item.id}-title`}>
      <div className="relative">
        <div className="h-52 w-full overflow-hidden bg-white/[0.03] sm:h-56">
          <WardrobeImage item={item} alt={`${item.name} primary jacket photo`} className="h-full w-full object-cover" fallbackClassName="flex h-full w-full items-center justify-center bg-white/[0.03] text-slate-600" iconSize={36} showLabel loading="lazy" />
        </div>
        {imageCount > 0 && <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur"><Images size={14} aria-hidden="true" />{imageCount} photo{imageCount === 1 ? "" : "s"}</span>}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="info">{categoryLabel}</Badge>
              {item.archived && <Badge tone="warning">Archived</Badge>}
              {item.ai_generated && <Badge tone="purple"><Sparkles size={12} aria-hidden="true" />AI assisted</Badge>}
              <EmbeddingStatusBadge embedding={item.embedding} />
            </div>
            <h2 id={`jacket-${item.id}-title`} className="truncate text-lg font-black text-white">{item.name}</h2>
            <p className="text-sm text-slate-400">{colorLabel} {subtypeLabel}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2" aria-label={`Actions for ${item.name}`}>
            <button type="button" onClick={() => onToggleFavorite(item.id)} disabled={loading} aria-pressed={Boolean(item.favorite)} className={`touch-target rounded-xl p-2 transition disabled:opacity-50 ${item.favorite ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-slate-400 hover:bg-pink-500/10 hover:text-pink-300"}`} aria-label={item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}><Heart size={17} fill={item.favorite ? "currentColor" : "none"} aria-hidden="true" /></button>
            <button type="button" onClick={() => onEdit(item)} disabled={loading} className="touch-target rounded-xl bg-sky-500/10 p-2 text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50" aria-label={`Edit ${item.name}`}><Pencil size={17} aria-hidden="true" /></button>
            <button type="button" onClick={() => onArchive(item.id, !item.archived)} disabled={loading} className="touch-target rounded-xl bg-amber-400/10 p-2 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50" aria-label={item.archived ? `Restore ${item.name}` : `Archive ${item.name}`}>{item.archived ? <ArchiveRestore size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}</button>
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={loading} className="touch-target rounded-xl bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50" aria-label={`Delete ${item.name}`}><Trash2 size={17} aria-hidden="true" /></button>
          </div>
        </div>

        {item.description && <p className="mb-4 text-sm leading-6 text-slate-300">{item.description}</p>}

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <RatingTile label="Warmth" value={item.warmth_rating} />
          <RatingTile label="Rain" value={item.rain_rating} />
          <RatingTile label="Wind" value={item.wind_rating} />
          <RatingTile label="Formality" value={item.formality_rating} />
        </dl>

        {item.materials?.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Materials">{item.materials.map((material) => <Badge key={material}>{formatWardrobeLabel(material)}</Badge>)}</div>}
        {item.style_tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Style tags">{item.style_tags.map((tag) => <Badge key={tag} tone="purple">{formatWardrobeLabel(tag)}</Badge>)}</div>}
        {item.weather_use?.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Weather use">{item.weather_use.map((weatherUse) => <Badge key={weatherUse} tone="success">{formatWardrobeLabel(weatherUse)}</Badge>)}</div>}

        {!item.archived && <SimilarJacketsPanel item={item} />}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(item.id); }}
        title={`Delete ${item.name}?`}
        description="This permanently removes the jacket, its photos, similarity data, and future recommendation eligibility."
        confirmLabel="Delete jacket"
        danger
        loading={loading}
      />
    </article>
  );
}
