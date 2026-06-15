import ClosetItemCard from "../components/ClosetItemCard";
import ClosetItemForm from "../components/ClosetItemForm";
import useAuth from "../hooks/useAuth";
import useClosetItems from "../hooks/useClosetItems";

function ClosetPage() {
const { user } = useAuth();

const {
closetItems,
closetLoading,
closetError,
saveClosetItem,
deleteClosetItem,
} = useClosetItems(user);

return (
<section>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Closet
    </p>

    <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Your jackets
    </h1>

    <p className="mt-2 text-slate-400">
        Add jackets so personalized mode can recommend what you actually own.
    </p>
    </div>

    {closetError && (
    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {closetError}
    </div>
    )}

    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
    <ClosetItemForm onSave={saveClosetItem} loading={closetLoading} />

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
            onDelete={deleteClosetItem}
            deleting={closetLoading}
            />
        ))
        )}
    </div>
    </div>
</section>
);
}

export default ClosetPage;