import {
ImageOff,
Pencil,
Sparkles,
Trash2,
} from "lucide-react";

function formatLabel(value = "") {
return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
    character.toUpperCase()
    );
}

function ClosetItemCard({
item,
onEdit,
onDelete,
deleting = false,
}) {
const handleDelete = () => {
    const confirmed = window.confirm(
    `Delete "${item.name}" from your closet?`
    );

    if (confirmed) {
    onDelete(item.id);
    }
};

return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
    {item.image_url ? (
        <img
        src={item.image_url}
        alt={item.name}
        className="h-56 w-full object-cover"
        />
    ) : (
        <div className="flex h-40 items-center justify-center bg-white/[0.03] text-slate-600">
        <ImageOff size={36} />
        </div>
    )}

    <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
        <div>
            {item.ai_generated && (
            <div className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-purple-300">
                <Sparkles size={13} />
                AI assisted
            </div>
            )}

            <p className="text-lg font-black text-white">
            {item.name}
            </p>

            <p className="text-sm capitalize text-slate-400">
            {formatLabel(item.color)}{" "}
            {formatLabel(item.type)}
            </p>
        </div>

        <div className="flex gap-2">
            <button
            type="button"
            onClick={() => onEdit(item)}
            disabled={deleting}
            className="rounded-xl bg-sky-500/10 p-2 text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
            aria-label={`Edit ${item.name}`}
            >
            <Pencil size={17} />
            </button>

            <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
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

        <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-slate-400">
            Warmth
            </p>

            <p className="font-black text-white">
            {item.warmth_rating}/5
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-slate-400">
            Rain
            </p>

            <p className="font-black text-white">
            {item.rain_rating}/5
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-slate-400">
            Wind
            </p>

            <p className="font-black text-white">
            {item.wind_rating}/5
            </p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-slate-400">
            Preference Score
            </p>

            <p
            className={`font-black ${
                Number(
                item.times_recommended ||
                    0
                ) > 0
                ? "text-emerald-300"
                : Number(
                        item.times_recommended ||
                        0
                    ) < 0
                    ? "text-red-300"
                    : "text-white"
            }`}
            >
            {Number(
                item.times_recommended ||
                0
            ) > 0
                ? "+"
                : ""}
            {item.times_recommended ||
                0}
            </p>
        </div>
        </div>

        {item.style_tags?.length >
        0 && (
        <div className="mt-4 flex flex-wrap gap-2">
            {item.style_tags.map(
            (tag) => (
                <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300"
                >
                {formatLabel(tag)}
                </span>
            )
            )}
        </div>
        )}

        {item.weather_use?.length >
        0 && (
        <div className="mt-3 flex flex-wrap gap-2">
            {item.weather_use.map(
            (weatherUse) => (
                <span
                key={weatherUse}
                className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                >
                {formatLabel(
                    weatherUse
                )}
                </span>
            )
            )}
        </div>
        )}
    </div>
    </article>
);
}

export default ClosetItemCard;