import { useMemo, useState } from "react";
import {
Search,
SlidersHorizontal,
} from "lucide-react";

import WardrobeItemCard from "../components/WardrobeItemCard";
import WardrobeItemForm from "../components/WardrobeItemForm";

import {
WARDROBE_CATEGORIES,
WARDROBE_SORT_OPTIONS,
} from "../data/wardrobeOptions";

import useWardrobeItems from "../hooks/useWardrobeItems";

const controlClass =
"rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500/70";

function WardrobePage() {
const {
wardrobeItems,
wardrobeLoading,
wardrobeRefreshing,
wardrobeError,
saveWardrobeItem,
updateWardrobeItem,
deleteWardrobeItem,
toggleWardrobeFavorite,
setWardrobeArchived,
} = useWardrobeItems();

const [editingItem, setEditingItem] =
useState(null);

const [searchTerm, setSearchTerm] =
useState("");

const [categoryFilter, setCategoryFilter] =
useState("all");

const [archiveFilter, setArchiveFilter] =
useState("active");

const [sortOption, setSortOption] =
useState("newest");

const [favoritesOnly, setFavoritesOnly] =
useState(false);

const filteredItems = useMemo(() => {
const normalizedSearch = searchTerm
    .trim()
    .toLowerCase();

const matches = wardrobeItems.filter(
    (item) => {
    const searchableValues = [
        item.name,
        item.category,
        item.subtype,
        item.type,
        item.primary_color,
        item.color,
        item.secondary_color,
        item.description,
        ...(item.materials || []),
        ...(item.style_tags || []),
        ...(item.weather_use || []),
    ].filter(Boolean);

    const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
        String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );

    const matchesCategory =
        categoryFilter === "all" ||
        item.category === categoryFilter;

    const matchesArchive =
        archiveFilter === "all" ||
        (archiveFilter === "archived"
        ? item.archived
        : !item.archived);

    const matchesFavorite =
        !favoritesOnly || item.favorite;

    return (
        matchesSearch &&
        matchesCategory &&
        matchesArchive &&
        matchesFavorite
    );
    }
);

return [...matches].sort(
    (first, second) => {
    if (sortOption === "oldest") {
        return (
        new Date(first.created_at) -
        new Date(second.created_at)
        );
    }

    if (sortOption === "name_asc") {
        return String(
        first.name
        ).localeCompare(
        String(second.name)
        );
    }

    if (sortOption === "name_desc") {
        return String(
        second.name
        ).localeCompare(
        String(first.name)
        );
    }

    if (
        sortOption === "favorites" &&
        first.favorite !== second.favorite
    ) {
        return (
        Number(second.favorite) -
        Number(first.favorite)
        );
    }

    return (
        new Date(second.created_at) -
        new Date(first.created_at)
    );
    }
);
}, [
wardrobeItems,
searchTerm,
categoryFilter,
archiveFilter,
sortOption,
favoritesOnly,
]);

const handleSave = async (
payload,
imageFile
) => {
if (editingItem) {
    const updatedItem =
    await updateWardrobeItem(
        editingItem.id,
        payload,
        imageFile
    );

    if (updatedItem) {
    setEditingItem(null);
    }

    return updatedItem;
}

return saveWardrobeItem(
    payload,
    imageFile
);
};

const handleEdit = (item) => {
setEditingItem(item);

window.scrollTo({
    top: 0,
    behavior: "smooth",
});
};

const activeCount =
wardrobeItems.filter(
    (item) => !item.archived
).length;

const archivedCount =
wardrobeItems.length - activeCount;

const favoriteCount =
wardrobeItems.filter(
    (item) => item.favorite
).length;

return (
<section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Wardrobe
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Everything you own
        </h1>

        <p className="mt-2 max-w-2xl text-slate-400">
        Save jackets, tops, layers, bottoms,
        shoes, and accessories in one place.
        </p>
    </div>

    {wardrobeRefreshing && (
        <p className="text-xs font-semibold text-slate-500">
        Syncing…
        </p>
    )}
    </div>

    {wardrobeError && (
    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {wardrobeError}
    </div>
    )}

    <div className="mb-6 grid gap-3 sm:grid-cols-3">
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">
        Active items
        </p>

        <p className="mt-1 text-2xl font-black text-white">
        {activeCount}
        </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">
        Favorites
        </p>

        <p className="mt-1 text-2xl font-black text-pink-300">
        {favoriteCount}
        </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">
        Archived
        </p>

        <p className="mt-1 text-2xl font-black text-amber-200">
        {archivedCount}
        </p>
    </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
    <WardrobeItemForm
        onSave={handleSave}
        loading={wardrobeLoading}
        editingItem={editingItem}
        onCancelEdit={() =>
        setEditingItem(null)
        }
    />

    <div>
        <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-300">
            <SlidersHorizontal size={18} />

            <p className="font-bold">
            Filter wardrobe
            </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
            <label className="relative sm:col-span-2">
            <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
                value={searchTerm}
                onChange={(event) =>
                setSearchTerm(
                    event.target.value
                )
                }
                placeholder="Search name, color, type, material..."
                className={`${controlClass} w-full pl-11`}
            />
            </label>

            <select
            value={categoryFilter}
            onChange={(event) =>
                setCategoryFilter(
                event.target.value
                )
            }
            className={controlClass}
            >
            <option value="all">
                All categories
            </option>

            {WARDROBE_CATEGORIES.map(
                (category) => (
                <option
                    key={category.value}
                    value={category.value}
                >
                    {category.label}
                </option>
                )
            )}
            </select>

            <select
            value={archiveFilter}
            onChange={(event) =>
                setArchiveFilter(
                event.target.value
                )
            }
            className={controlClass}
            >
            <option value="active">
                Active items
            </option>

            <option value="archived">
                Archived items
            </option>

            <option value="all">
                Active and archived
            </option>
            </select>

            <select
            value={sortOption}
            onChange={(event) =>
                setSortOption(
                event.target.value
                )
            }
            className={controlClass}
            >
            {WARDROBE_SORT_OPTIONS.map(
                (option) => (
                <option
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </option>
                )
            )}
            </select>

            <button
            type="button"
            onClick={() =>
                setFavoritesOnly(
                (current) => !current
                )
            }
            className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                favoritesOnly
                ? "border-pink-400/50 bg-pink-500/20 text-pink-200"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
            >
            {favoritesOnly
                ? "Showing favorites"
                : "Favorites only"}
            </button>
        </div>
        </div>

        <p className="mb-4 text-sm font-semibold text-slate-400">
        {filteredItems.length} item
        {filteredItems.length === 1
            ? ""
            : "s"}
        </p>

        <div className="space-y-4">
        {wardrobeLoading &&
        wardrobeItems.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-300">
            Loading wardrobe...
            </div>
        ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
            No wardrobe items match these
            filters.
            </div>
        ) : (
            filteredItems.map((item) => (
            <WardrobeItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={deleteWardrobeItem}
                onToggleFavorite={
                toggleWardrobeFavorite
                }
                onArchive={
                setWardrobeArchived
                }
                loading={wardrobeLoading}
            />
            ))
        )}
        </div>
    </div>
    </div>
</section>
);
}

export default WardrobePage;