import Skeleton from "./Skeleton";

export default function LoadingState({ label = "Loading", rows = 3 }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
      </div>
    </div>
  );
}
