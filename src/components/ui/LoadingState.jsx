import Skeleton from "./Skeleton";
import TextShimmer from "./TextShimmer";

export default function LoadingState({ label = "Loading", rows = 3 }) {
  return (
    <section aria-busy="true" aria-label={label} className="storm-card-soft rounded-[var(--radius-large)] p-5 sm:p-6">
      <TextShimmer className="text-sm font-extrabold">{label}…</TextShimmer>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className={index === 0 ? "h-7 w-2/3" : "h-16 w-full"} />)}
      </div>
    </section>
  );
}
