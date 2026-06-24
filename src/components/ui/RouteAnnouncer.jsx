import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const titles = {
  "/": "Guest jacket check",
  "/auth": "Sign in or create account",
  "/app": "Personalized jacket check",
  "/wardrobe": "Jacket closet",
  "/history": "Recommendation history",
  "/profile": "Profile settings",
  "/dev/scoring": "Developer scoring",
  "/dev/trends": "Developer trends",
  "/dev/analytics": "Developer analytics",
};

export default function RouteAnnouncer() {
  const location = useLocation();
  const liveRef = useRef(null);

  useEffect(() => {
    const title = titles[location.pathname] || "JacketCheck";
    document.title = `${title} | JacketCheck`;
    if (liveRef.current) liveRef.current.textContent = title;
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
  }, [location.pathname]);

  return <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />;
}
