import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const NetworkStatusContext = createContext(null);

export function NetworkStatusProvider({ children }) {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [lastChangedAt, setLastChangedAt] = useState(0);

  const refresh = useCallback(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setLastChangedAt(Date.now());
  }, []);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setLastChangedAt(Date.now()); };
    const handleOffline = () => { setOnline(false); setLastChangedAt(Date.now()); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const value = useMemo(() => ({ online, offline: !online, lastChangedAt, refresh }), [online, lastChangedAt, refresh]);
  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}
