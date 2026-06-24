import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_FAILURE_LIMIT,
  ANALYTICS_FLUSH_INTERVAL_MS,
  ROUTE_EVENT_MAP,
} from "../config/analyticsConfig";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import createAnonymousSessionId from "../utils/createAnonymousSessionId";
import { getExperienceMode } from "../utils/analyticsEvents";
import { sanitizeAnalyticsEvent } from "../utils/sanitizeAnalyticsPayload";

export const AnalyticsContext = createContext(null);

function readGuestConsent() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "false";
  } catch {
    return true;
  }
}

export function AnalyticsProvider({ children }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const [guestAnalyticsEnabled, setGuestAnalyticsEnabled] = useState(readGuestConsent);
  const [disabledForSession, setDisabledForSession] = useState(false);
  const queueRef = useRef([]);
  const flushingRef = useRef(false);
  const failureCountRef = useRef(0);
  const lastRouteEventRef = useRef("");
  const sessionIdRef = useRef(createAnonymousSessionId());

  const analyticsEnabled = user
    ? profile?.analytics_enabled !== false
    : guestAnalyticsEnabled;

  const flush = useCallback(async () => {
    if (
      flushingRef.current ||
      disabledForSession ||
      !analyticsEnabled ||
      queueRef.current.length === 0
    ) {
      return;
    }

    flushingRef.current = true;
    const batch = queueRef.current.splice(0, 12);

    try {
      const { error } = await supabase.functions.invoke("track-analytics", {
        body: {
          anonymous_session_id: sessionIdRef.current,
          events: batch,
        },
      });

      if (error) {
        throw error;
      }

      failureCountRef.current = 0;
    } catch {
      failureCountRef.current += 1;
      if (failureCountRef.current >= ANALYTICS_FAILURE_LIMIT) {
        setDisabledForSession(true);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [analyticsEnabled, disabledForSession]);

  const track = useCallback(
    (eventName, options = {}) => {
      if (!analyticsEnabled || disabledForSession) {
        return false;
      }

      try {
        const event = sanitizeAnalyticsEvent({
          event_name: eventName,
          route: options.route || location.pathname,
          experience_mode:
            options.experienceMode ||
            getExperienceMode(location.pathname, user),
          success: options.success,
          duration_ms: options.durationMs,
          metadata: options.metadata,
        });

        queueRef.current.push(event);
        if (queueRef.current.length >= 8) {
          queueMicrotask(flush);
        }
        return true;
      } catch {
        return false;
      }
    },
    [analyticsEnabled, disabledForSession, flush, location.pathname, user]
  );

  const setAnalyticsEnabled = useCallback(
    (nextEnabled) => {
      const enabled = Boolean(nextEnabled);
      setGuestAnalyticsEnabled(enabled);
      try {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, String(enabled));
      } catch {
        // Analytics consent remains in memory when storage is unavailable.
      }
    },
    []
  );

  useEffect(() => {
    const handleExternalEvent = (event) => {
      const detail = event?.detail || {};
      if (detail.eventName) {
        track(detail.eventName, detail.options || {});
      }
    };
    window.addEventListener("jacketcheck:analytics", handleExternalEvent);
    return () => window.removeEventListener("jacketcheck:analytics", handleExternalEvent);
  }, [track]);

  useEffect(() => {
    const routeEvent = ROUTE_EVENT_MAP[location.pathname];
    if (!routeEvent) return;

    const routeKey = `${location.pathname}:${user?.id || "guest"}`;
    if (lastRouteEventRef.current === routeKey) return;

    lastRouteEventRef.current = routeKey;
    track(routeEvent, {
      metadata: {
        route_group: location.pathname.startsWith("/dev/")
          ? "developer"
          : location.pathname === "/"
            ? "guest"
            : "account",
      },
    });
  }, [location.pathname, track, user?.id]);

  useEffect(() => {
    const interval = window.setInterval(flush, ANALYTICS_FLUSH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      flush();
    };
  }, [flush]);

  const value = useMemo(
    () => ({
      track,
      flush,
      analyticsEnabled,
      analyticsAvailable: !disabledForSession,
      setAnalyticsEnabled,
    }),
    [track, flush, analyticsEnabled, disabledForSession, setAnalyticsEnabled]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
