import { WifiOff } from "lucide-react";
import useNetworkStatus from "../hooks/useNetworkStatus";

export default function OfflineBanner() {
  const { offline } = useNetworkStatus();
  if (!offline) return null;

  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-[90] flex items-center justify-center gap-2 border-b border-amber-300/20 bg-amber-950/90 px-4 py-2.5 text-sm font-extrabold text-amber-100 backdrop-blur-xl">
      <WifiOff size={16} aria-hidden="true" />
      You are offline. Cached content remains visible, but new checks and saves need a connection.
    </div>
  );
}
