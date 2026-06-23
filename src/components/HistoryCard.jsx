import {
  Clock,
  CloudRain,
  MapPin,
  Shirt,
  Sparkles,
  Trash2,
  Wind,
} from "lucide-react";

import WardrobeImage from "./WardrobeImage";
import { resolveWardrobeImageUrl } from "../utils/resolveWardrobeImage";

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value = "") {
  return String(value).replaceAll("_", " ");
}

function getItemId(entry) {
  return entry?.wardrobe_item_id || entry?.closet_item_id || null;
}

function getLegacyPieceName(piece) {
  if (typeof piece === "string") {
    return piece;
  }

  if (!piece || typeof piece !== "object") {
    return null;
  }

  return (
    piece.item_name ||
    piece.itemName ||
    piece.name ||
    null
  );
}

function getStyleIdea(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const title =
    snapshot.title ||
    snapshot.outfitTitle ||
    "Style idea";

  if (snapshot.summary) {
    return {
      title,
      summary: snapshot.summary,
      weatherNote: snapshot.weatherNote || null,
    };
  }

  const namedPieces = Array.isArray(snapshot.pieces)
    ? snapshot.pieces
        .map(getLegacyPieceName)
        .filter(Boolean)
        .slice(0, 4)
    : [];

  if (namedPieces.length > 0) {
    return {
      title,
      summary: `Earlier fit idea: ${namedPieces.join(", ")}.`,
      weatherNote: snapshot.weatherNote || null,
    };
  }

  const legacyPieces = [
    snapshot.top,
    snapshot.bottoms,
    snapshot.shoes,
    snapshot.accessory,
  ].filter(Boolean);

  if (legacyPieces.length > 0) {
    return {
      title,
      summary: `Earlier fit idea: ${legacyPieces.join(", ")}.`,
      weatherNote: snapshot.weatherNote || null,
    };
  }

  return null;
}

function HistoryCard({
  entry,
  feedback,
  wardrobeItem = null,
  wardrobeLoading = false,
  onDelete,
  deleting = false,
}) {
  const weather = entry.weather_snapshot || {};
  const styleIdea = getStyleIdea(entry.outfit_json);
  const wardrobeItemId = getItemId(entry);
  const shouldShowImage =
    entry.decision === "YES" || Boolean(wardrobeItemId);
  const resolvedImageUrl = resolveWardrobeImageUrl(wardrobeItem);

  const imageStatus = wardrobeLoading
    ? "Loading current jacket photo…"
    : wardrobeItem
      ? resolvedImageUrl
        ? "Current primary jacket photo"
        : "No photo is currently saved for this jacket"
      : wardrobeItemId
        ? "This jacket is no longer available"
        : "No saved jacket was attached to this recommendation";

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
      {shouldShowImage && (
        <div className="relative h-48 w-full bg-slate-900/70">
          {wardrobeLoading ? (
            <div className="flex h-full w-full animate-pulse items-center justify-center bg-white/[0.04] text-slate-600">
              <Shirt size={30} aria-hidden="true" />
            </div>
          ) : (
            <WardrobeImage
              item={wardrobeItem}
              alt={`${wardrobeItem?.name || entry.jacket_name || "Recommended jacket"} current primary jacket photo`}
              className="h-48 w-full object-cover"
              fallbackClassName="flex h-48 w-full items-center justify-center bg-white/[0.04] text-slate-600"
              iconSize={32}
              showLabel
            />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-5 pb-4 pt-10">
            <p className="text-xs font-semibold text-slate-300">
              {imageStatus}
            </p>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Clock size={14} />
              {formatDate(entry.created_at)}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span
                className={`text-3xl font-black ${
                  entry.decision === "YES"
                    ? "text-sky-300"
                    : "text-emerald-300"
                }`}
              >
                {entry.decision}
              </span>

              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {wardrobeItem?.name || entry.jacket_name}
                </p>

                <p className="text-sm capitalize text-slate-400">
                  {formatLabel(entry.time_window)}
                </p>

                {wardrobeItem &&
                  wardrobeItem.name !== entry.jacket_name && (
                    <p className="mt-1 text-xs text-slate-500">
                      Originally saved as {entry.jacket_name}
                    </p>
                  )}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(entry.id)}
            className="rounded-xl bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Delete history entry"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {entry.summary && (
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {entry.summary}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          {weather.city && (
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
              <MapPin size={13} />
              {weather.city}
            </span>
          )}

          {weather.feelsLike !== null &&
            weather.feelsLike !== undefined && (
              <span className="rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
                Feels {Math.round(weather.feelsLike)}°F
              </span>
            )}

          {weather.rainChance !== null &&
            weather.rainChance !== undefined && (
              <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
                <CloudRain size={13} />
                {weather.rainChance}%
              </span>
            )}

          {weather.windSpeed !== null &&
            weather.windSpeed !== undefined && (
              <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2 text-slate-300">
                <Wind size={13} />
                {Math.round(weather.windSpeed)} mph
              </span>
            )}
        </div>

        {styleIdea && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2 font-bold text-emerald-200">
              <Sparkles size={16} />
              Style idea
            </div>

            <p className="mt-2 font-black text-white">
              {styleIdea.title}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              {styleIdea.summary}
            </p>

            {styleIdea.weatherNote && (
              <p className="mt-2 text-xs leading-5 text-emerald-100/80">
                {styleIdea.weatherNote}
              </p>
            )}
          </div>
        )}

        {feedback && (
          <p className="mt-4 text-sm font-bold capitalize text-purple-300">
            Your rating: {feedback.rating.replaceAll("_", " ")}
          </p>
        )}
      </div>
    </article>
  );
}

export default HistoryCard;
