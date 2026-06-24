import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ErrorState({
  title = "Something went wrong",
  message = "The request could not be completed.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <section
      role="alert"
      aria-labelledby="error-state-title"
      className={`rounded-3xl border border-rose-400/25 bg-rose-950/30 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="error-state-title" className="text-xl font-black text-white">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-100/80">
            {message}
          </p>
          {onRetry && (
            <div className="mt-5">
              <Button type="button" variant="secondary" onClick={onRetry}>
                {retryLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
