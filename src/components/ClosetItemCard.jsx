import { ImageOff, Trash2 } from "lucide-react";

function ClosetItemCard({ item, onDelete, deleting = false }) {
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
        <p className="text-lg font-black text-white">{item.name}</p>

        <p className="text-sm capitalize text-slate-400">
            {item.color} {item.type.replaceAll("_", " ")}
        </p>
        </div>

        <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-xl bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Delete ${item.name}`}
        >
        <Trash2 size={17} />
        </button>
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/[0.04] p-3">
        <p className="text-slate-400">Warmth</p>
        <p className="font-black text-white">{item.warmth_rating}/5</p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
        <p className="text-slate-400">Rain</p>
        <p className="font-black text-white">{item.rain_rating}/5</p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
        <p className="text-slate-400">Wind</p>
        <p className="font-black text-white">{item.wind_rating}/5</p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-3">
        <p className="text-slate-400">Recommended</p>
        <p className="font-black text-white">
            {item.times_recommended || 0}x
        </p>
        </div>
    </div>

    {item.style_tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
        {item.style_tags.map((tag) => (
            <span
            key={tag}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-slate-300"
            >
            {tag.replaceAll("_", " ")}
            </span>
        ))}
        </div>
    )}
    </div>
</article>
);
}

export default ClosetItemCard;