import { AlertTriangle } from "lucide-react";
import RetryAction from "./RetryAction";

export default function RecoverableErrorPanel({ title = "Something went wrong", message, onRetry, retrying = false }) {
  return (
    <section role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-950/30 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 text-rose-300" size={20} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-rose-100/80">{message}</p>
          {onRetry && <div className="mt-4"><RetryAction onRetry={onRetry} disabled={retrying} label={retrying ? "Retrying…" : "Try again"} /></div>}
        </div>
      </div>
    </section>
  );
}
