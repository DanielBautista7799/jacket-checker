import {
  Archive,
  ArchiveRestore,
  Heart,
  Images,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";

import { formatWardrobeLabel } from "../data/wardrobeOptions";
import WardrobeImage from "./WardrobeImage";

function RatingTile({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <p className="text-slate-400">{label}</p>

      <p className="font-black text-white">{Number(value) || 1}/5</p>
    </div>
  );
}

function WardrobeItemCard({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onArchive,
  loading = false,
}) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Permanently delete "${item.name}" from your jacket closet?`
    );

    if (confirmed) {
      onDelete(item.id);
    }
  };

  const categoryLabel = formatWardrobeLabel(item.category);
  const subtypeLabel = formatWardrobeLabel(item.subtype || item.type);
  const colorLabel = formatWardrobeLabel(
    item.primary_color || item.color
  );
  const imageCount = Number(item.image_count) || item.images?.length || 0;

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-slate-950/60 ${
        item.archived
          ? "border-amber-400/25 opacity-80"
          : "border-white/10"
      }`}
    >
      <div className="relative">
        <div className="h-56 w-full overflow-hidden bg-white/[0.03]">
          <WardrobeImage
            item={item}
            alt={`${item.name} primary jacket photo`}
            className="h-56 w-full object-cover"
            fallbackClassName="flex h-56 w-full items-center justify-center bg-white/[0.03] text-slate-600"
            iconSize={36}
            showLabel
          />
        </div>

        {imageCount > 0 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur">
            <Images size={14} />
            {imageCount} photo{imageCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-200">
                {categoryLabel}
              </span>

              {item.archived && (
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
                  Archived
                </span>
              )}

              {item.ai_generated && (
                <span className="flex items-center gap-1 rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-200">
                  <Sparkles size={12} />
                  AI assisted
                </span>
              )}
            </div>

            <p className="truncate text-lg font-black text-white">
              {item.name}
            </p>

            <p className="text-sm text-slate-400">
              {colorLabel} {subtypeLabel}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              disabled={loading}
              className={`rounded-xl p-2 transition disabled:opacity-50 ${
                item.favorite
                  ? "bg-pink-500/20 text-pink-300"
                  : "bg-white/5 text-slate-400 hover:bg-pink-500/10 hover:text-pink-300"
              }`}
              aria-label={
                item.favorite
                  ? `Remove ${item.name} from favorites`
                  : `Add ${item.name} to favorites`
              }
            >
              <Heart
                size={17}
                fill={item.favorite ? "currentColor" : "none"}
              />
            </button>

            <button
              type="button"
              onClick={() => onEdit(item)}
              disabled={loading}
              className="rounded-xl bg-sky-500/10 p-2 text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
              aria-label={`Edit ${item.name}`}
            >
              <Pencil size={17} />
            </button>

            <button
              type="button"
              onClick={() => onArchive(item.id, !item.archived)}
              disabled={loading}
              className="rounded-xl bg-amber-400/10 p-2 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
              aria-label={
                item.archived
                  ? `Restore ${item.name}`
                  : `Archive ${item.name}`
              }
            >
              {item.archived ? (
                <ArchiveRestore size={17} />
              ) : (
                <Archive size={17} />
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-xl bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {item.description && (
          <p className="mb-4 text-sm leading-6 text-slate-300">
            {item.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <RatingTile label="Warmth" value={item.warmth_rating} />
          <RatingTile label="Rain" value={item.rain_rating} />
          <RatingTile label="Wind" value={item.wind_rating} />
          <RatingTile label="Formality" value={item.formality_rating} />
        </div>

        {item.materials?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.materials.map((material) => (
              <span
                key={material}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300"
              >
                {formatWardrobeLabel(material)}
              </span>
            ))}
          </div>
        )}

        {item.style_tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.style_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200"
              >
                {formatWardrobeLabel(tag)}
              </span>
            ))}
          </div>
        )}

        {item.weather_use?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.weather_use.map((weatherUse) => (
              <span
                key={weatherUse}
                className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200"
              >
                {formatWardrobeLabel(weatherUse)}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default WardrobeItemCard;
