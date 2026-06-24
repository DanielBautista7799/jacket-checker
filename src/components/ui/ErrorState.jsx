import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div role="alert" className="rounded-3xl border border-red-400/25 bg-red-400/10 p-6 text-center text-red-100">
      <AlertTriangle size={28} className="mx-auto" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      {message && <p className="mt-2 text-sm leading-6 text-red-100/80">{message}</p>}
      {onRetry && <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
