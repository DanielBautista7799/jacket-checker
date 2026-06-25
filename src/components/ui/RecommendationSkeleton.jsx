import Skeleton from "./Skeleton";
import TextShimmer from "./TextShimmer";

export default function RecommendationSkeleton() {
  return (
    <section className="recommendation-shell min-h-[29rem] p-5 sm:p-8" aria-label="Building recommendation" aria-busy="true">
      <TextShimmer className="text-xs font-extrabold uppercase tracking-[0.18em]">Building your recommendation…</TextShimmer>
      <Skeleton className="mt-8 h-20 w-44 rounded-2xl" />
      <Skeleton className="mt-5 h-9 w-64 rounded-xl" />
      <div className="mt-7 space-y-3">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
      </div>
    </section>
  );
}
