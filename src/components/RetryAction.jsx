import { RefreshCw } from "lucide-react";
import Button from "./ui/Button";

export default function RetryAction({ onRetry, label = "Try again", disabled = false }) {
  return (
    <Button type="button" variant="secondary" onClick={onRetry} disabled={disabled}>
      <RefreshCw size={16} aria-hidden="true" /> {label}
    </Button>
  );
}
