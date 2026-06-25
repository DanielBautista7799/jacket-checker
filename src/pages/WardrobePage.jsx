import { useMemo, useState } from "react";
import { Plus, Search, Shirt, SlidersHorizontal } from "lucide-react";

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
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
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
    <section className="page-enter space-y-6" aria-labelledby="wardrobe-title">
      <PageHeader
        eyebrow="Wardrobe"
        title="Your saved jackets"
        description="Keep the jackets you actually own, manage their photos, and let personalized mode choose the best match for the forecast."
        actions={
          <Button type="button" onClick={() => { setEditingItemId(null); document.getElementById("jacket-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <Plus size={18} aria-hidden="true" /> Add jacket
          </Button>
        }
      />

      {(wardrobeRefreshing || wardrobeImageLoading) && <p role="status" className="text-right text-xs font-extrabold text-slate-500">Syncing jacket data…</p>}
      {wardrobeError && <Alert tone="error">{wardrobeError}</Alert>}
      {wardrobeImageError && <Alert tone="error">{wardrobeImageError}</Alert>}

      <JacketEmbeddingBackfill />

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Active jackets", activeCount, "info"],
          ["Saved photos", imageCount, "info"],
          ["Favorites", favoriteCount, "purple"],
          ["Archived", archivedCount, "warning"],
        ].map(([label, value, tone]) => (
          <Card key={label} as="div" className="p-4" soft>
            <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
            <dd className="font-display mt-2 text-3xl font-bold text-white">{value}</dd>
            <Badge tone={tone} className="mt-3">Jackets only</Badge>
          </Card>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.22fr)] xl:items-start">
        <div id="jacket-editor" className="scroll-mt-28">
          <WardrobeItemForm
            onSave={handleSave}
            loading={wardrobeLoading}
            editingItem={editingItem}
            onCancelEdit={() => setEditingItemId(null)}
            onSaveComplete={handleSaveComplete}
          />
        </div>

        <div>
          <Card className="mb-5 p-4 sm:p-5" soft>
            <div className="mb-4 flex items-center gap-2 text-slate-200"><SlidersHorizontal size={18} aria-hidden="true" /><h2 className="font-extrabold">Find a jacket</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative sm:col-span-2">
                <span className="sr-only">Search jackets</span>
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, color, type, or material" className="pl-11" type="search" />
              </label>
              <label className="text-sm font-extrabold text-slate-200">Status<Select className="mt-2" value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value)}><option value="active">Active jackets</option><option value="archived">Archived jackets</option><option value="all">Active and archived</option></Select></label>
              <label className="text-sm font-extrabold text-slate-200">Sort<Select className="mt-2" value={sortOption} onChange={(event) => setSortOption(event.target.value)}>{WARDROBE_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
              <Button type="button" variant={favoritesOnly ? "primary" : "secondary"} onClick={() => setFavoritesOnly((current) => !current)} aria-pressed={favoritesOnly} className="sm:col-span-2">{favoritesOnly ? "Showing favorites" : "Favorites only"}</Button>
            </div>
          </Card>

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-slate-400" aria-live="polite">{filteredItems.length} jacket{filteredItems.length === 1 ? "" : "s"}</p>
            <span className="text-xs font-bold text-slate-600">Image-first closet</span>
          </div>

          {wardrobeLoading && jackets.length === 0 ? (
            <LoadingState label="Loading jackets" rows={4} />
          ) : filteredItems.length === 0 ? (
            <EmptyState icon={Shirt} title={jackets.length ? "No jackets match these filters" : "Your wardrobe is ready for its first jacket."} description={jackets.length ? "Clear or adjust the filters to see more jackets." : "Add your first jacket with a photo or manual details to unlock personalized recommendations."} actionLabel={jackets.length ? undefined : "Add jacket"} onAction={jackets.length ? undefined : () => document.getElementById("jacket-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredItems.map((item) => (
                <WardrobeItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDeleteItem} onToggleFavorite={toggleWardrobeFavorite} onArchive={handleArchive} loading={actionLoading} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
