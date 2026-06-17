import { useState } from "react";

import ClosetItemCard from "../components/ClosetItemCard";
import ClosetItemForm from "../components/ClosetItemForm";

import useAuth from "../hooks/useAuth";
import useClosetItems from "../hooks/useClosetItems";

function ClosetPage() {
const { user } = useAuth();

const {
closetItems,
closetLoading,
closetRefreshing,
closetError,
saveClosetItem,
updateClosetItem,
deleteClosetItem,
} = useClosetItems(user);

const [editingItem, setEditingItem] =
useState(null);

const handleSave = async (
payload,
imageFile
) => {
if (editingItem) {
    const updatedItem =
    await updateClosetItem(
        editingItem.id,
        payload,
        imageFile
    );

    if (updatedItem) {
    setEditingItem(null);
    }

    return updatedItem;
}

return saveClosetItem(
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

const handleCancelEdit = () => {
setEditingItem(null);
};

return (
<section>
    <div className="mb-6 flex items-end justify-between gap-4">
    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Closet
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Your jackets
        </h1>

        <p className="mt-2 text-slate-400">
        Add and edit jackets so personalized mode can recommend what you actually own.
        </p>
    </div>

    {closetRefreshing && (
        <p className="text-xs font-semibold text-slate-500">
        Syncing…
        </p>
    )}
    </div>

    {closetError && (
    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {closetError}
    </div>
    )}

    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
    <ClosetItemForm
        onSave={handleSave}
        loading={closetLoading}
        editingItem={editingItem}
        onCancelEdit={
        handleCancelEdit
        }
    />

    <div className="space-y-4">
        {closetItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
            No jackets saved yet.
        </div>
        ) : (
        closetItems.map((item) => (
            <ClosetItemCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={
                deleteClosetItem
            }
            deleting={
                closetLoading
            }
            />
        ))
        )}
    </div>
    </div>
</section>
);
}

export default ClosetPage;