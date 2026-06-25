import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

export default function ErrorState({ title = "Something went wrong", description, message, onRetry, retryLabel = "Try again" }) {
  return (
    <Card className="border-rose-300/20 bg-rose-400/[0.045] p-5 sm:p-6" role="alert">
      <div className="flex gap-3">
        <AlertTriangle size={21} className="mt-0.5 shrink-0 text-rose-300" aria-hidden="true" />
        <div>
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          {(description || message) && <p className="mt-2 text-sm leading-6 text-slate-300">{description || message}</p>}
          {onRetry && <Button type="button" variant="secondary" onClick={onRetry} className="mt-4">{retryLabel}</Button>}
        </div>
      </div>
    </Card>
  );
}
