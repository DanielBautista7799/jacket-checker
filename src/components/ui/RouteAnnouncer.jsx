import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

const titles = {
  "/": "Guest jacket check",
  "/auth": "Sign in or create account",
  "/app": "Personalized jacket check",
  "/wardrobe": "Jacket closet",
  "/history": "Recommendation history",
  "/profile": "Profile settings",
  "/dev/access": "Developer access",
  "/dev/scoring": "Developer scoring",
  "/dev/trends": "Developer trends",
  "/dev/analytics": "Developer analytics",
};

export default function RouteAnnouncer() {
  const location = useLocation();
  const liveRef = useRef(null);
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const title = titles[location.pathname] || "JacketCheck";
    const isRouteChange = previousPathRef.current !== location.pathname;

    previousPathRef.current = location.pathname;
    document.title = `${title} | JacketCheck`;
    if (liveRef.current) liveRef.current.textContent = title;

    if (!isRouteChange) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      main?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname]);

  return <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />;
}
