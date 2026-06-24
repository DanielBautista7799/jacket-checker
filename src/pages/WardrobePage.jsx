import { useMemo, useState } from "react";
import { Search, Shirt, SlidersHorizontal } from "lucide-react";

import JacketEmbeddingBackfill from "../components/JacketEmbeddingBackfill";
import WardrobeItemCard from "../components/WardrobeItemCard";
import WardrobeItemForm from "../components/WardrobeItemForm";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { WARDROBE_SORT_OPTIONS } from "../data/wardrobeOptions";
import useWardrobeItems from "../hooks/useWardrobeItems";
import useAnalytics from "../hooks/useAnalytics";

export default function WardrobePage() {
  const { track } = useAnalytics();
  const {
    wardrobeItems,
    wardrobeLoading,
    wardrobeRefreshing,
    wardrobeError,
    wardrobeImageLoading,
    wardrobeImageError,
    saveWardrobeItem,
    updateWardrobeItem,
    deleteWardrobeItem,
    toggleWardrobeFavorite,
    setWardrobeArchived,
  } = useWardrobeItems();

  const [editingItemId, setEditingItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortOption, setSortOption] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const jackets = useMemo(() => wardrobeItems.filter((item) => item.category === "jacket"), [wardrobeItems]);
  const editingItem = useMemo(() => jackets.find((item) => item.id === editingItemId) || null, [jackets, editingItemId]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matches = jackets.filter((item) => {
      const searchableValues = [
        item.name,
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
      const matchesSearch = !normalizedSearch || searchableValues.some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesArchive = archiveFilter === "all" || (archiveFilter === "archived" ? item.archived : !item.archived);
      return matchesSearch && matchesArchive && (!favoritesOnly || item.favorite);
    });

    return [...matches].sort((first, second) => {
      if (sortOption === "oldest") return new Date(first.created_at) - new Date(second.created_at);
      if (sortOption === "name_asc") return String(first.name).localeCompare(String(second.name));
      if (sortOption === "name_desc") return String(second.name).localeCompare(String(first.name));
      if (sortOption === "favorites" && first.favorite !== second.favorite) return Number(second.favorite) - Number(first.favorite);
      return new Date(second.created_at) - new Date(first.created_at);
    });
  }, [jackets, searchTerm, archiveFilter, sortOption, favoritesOnly]);

  const handleSave = async (payload, primaryImageFile) => {
    const jacketPayload = { ...payload, category: "jacket" };
    const saved = editingItem
      ? await updateWardrobeItem(editingItem.id, jacketPayload, primaryImageFile)
      : await saveWardrobeItem(jacketPayload, primaryImageFile);

    if (saved) {
      track(editingItem ? "jacket_updated" : "jacket_created", {
        experienceMode: "personalized",
        metadata: {
          jacket_subtype: saved.subtype || jacketPayload.subtype || "unknown",
          image_added: Boolean(primaryImageFile),
          ai_confirmed: Boolean(saved.confirmed_by_user),
        },
      });
    }
    return saved;
  };

  const handleEdit = (item) => {
    setEditingItemId(item.id);
    document.getElementById("jacket-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteItem = async (itemId) => {
    const item = jackets.find((entry) => entry.id === itemId);
    const deleted = await deleteWardrobeItem(itemId);
    if (deleted) {
      if (editingItemId === itemId) setEditingItemId(null);
      track("jacket_deleted", { experienceMode: "personalized", metadata: { jacket_subtype: item?.subtype || "unknown" } });
    }
    return deleted;
  };

  const handleArchive = async (itemId, archived) => {
    const item = jackets.find((entry) => entry.id === itemId);
    const updated = await setWardrobeArchived(itemId, archived);
    if (updated) {
      track(archived ? "jacket_archived" : "jacket_restored", { experienceMode: "personalized", metadata: { jacket_subtype: item?.subtype || "unknown" } });
    }
    return updated;
  };

  const handleSaveComplete = (savedItem, { imageWarning = false } = {}) => {
    if (imageWarning && savedItem?.id) {
      setEditingItemId(savedItem.id);
      return;
    }
    setEditingItemId(null);
  };

  const activeCount = jackets.filter((item) => !item.archived).length;
  const archivedCount = jackets.length - activeCount;
  const favoriteCount = jackets.filter((item) => item.favorite).length;
  const imageCount = jackets.reduce((total, item) => total + (Number(item.image_count) || item.images?.length || 0), 0);
  const actionLoading = wardrobeLoading || wardrobeImageLoading;

  return (
    <section className="page-enter" aria-labelledby="wardrobe-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Jacket closet</p>
          <h1 id="wardrobe-title" className="mt-2 text-4xl font-black tracking-tight text-white">Your saved jackets</h1>
          <p className="mt-3 leading-7 text-slate-400">Keep the jackets you actually own, manage up to eight photos each, and let personalized mode choose the safest match for the forecast.</p>
        </div>
        {(wardrobeRefreshing || wardrobeImageLoading) && <p role="status" className="text-xs font-bold text-slate-500">Syncing jacket data…</p>}
      </div>

      {wardrobeError && <div className="mb-5"><Alert tone="error">{wardrobeError}</Alert></div>}
      {wardrobeImageError && <div className="mb-5"><Alert tone="error">{wardrobeImageError}</Alert></div>}

      <JacketEmbeddingBackfill />

      <dl className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Active jackets", activeCount, "info"],
          ["Saved photos", imageCount, "info"],
          ["Favorites", favoriteCount, "purple"],
          ["Archived", archivedCount, "warning"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <dt className="text-sm text-slate-400">{label}</dt>
            <dd className="mt-1 text-2xl font-black text-white">{value}</dd>
            <Badge tone={tone} className="mt-3">Jackets only</Badge>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div id="jacket-editor" className="scroll-mt-24">
          <WardrobeItemForm
            onSave={handleSave}
            loading={wardrobeLoading}
            editingItem={editingItem}
            onCancelEdit={() => setEditingItemId(null)}
            onSaveComplete={handleSaveComplete}
          />
        </div>

        <div>
          <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-slate-200">
              <SlidersHorizontal size={18} aria-hidden="true" />
              <h2 className="font-black">Filter jackets</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative sm:col-span-2">
                <span className="sr-only">Search jackets</span>
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, color, type, or material" className="pl-11" type="search" />
              </label>

              <label className="text-sm font-bold text-slate-200">Status<Select className="mt-2" value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value)}><option value="active">Active jackets</option><option value="archived">Archived jackets</option><option value="all">Active and archived</option></Select></label>
              <label className="text-sm font-bold text-slate-200">Sort<Select className="mt-2" value={sortOption} onChange={(event) => setSortOption(event.target.value)}>{WARDROBE_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
              <Button type="button" variant={favoritesOnly ? "primary" : "secondary"} onClick={() => setFavoritesOnly((current) => !current)} aria-pressed={favoritesOnly} className="sm:col-span-2">{favoritesOnly ? "Showing favorites" : "Favorites only"}</Button>
            </div>
          </div>

          <p className="mb-4 text-sm font-bold text-slate-400" aria-live="polite">{filteredItems.length} jacket{filteredItems.length === 1 ? "" : "s"}</p>

          <div className="space-y-4">
            {wardrobeLoading && jackets.length === 0 ? (
              <LoadingState label="Loading jackets" rows={4} />
            ) : filteredItems.length === 0 ? (
              <EmptyState icon={Shirt} title={jackets.length ? "No jackets match these filters" : "Your jacket closet is empty"} description={jackets.length ? "Clear or adjust the filters to see more jackets." : "Add your first jacket with a photo or manual details to unlock personalized recommendations."} />
            ) : filteredItems.map((item) => (
              <WardrobeItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDeleteItem}
                onToggleFavorite={toggleWardrobeFavorite}
                onArchive={handleArchive}
                loading={actionLoading}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
