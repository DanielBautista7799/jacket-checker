import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import clearClientCaches from "../utils/clearClientCaches";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authEvent, setAuthEvent] = useState("");
  const mountedRef = useRef(true);

  const applySession = useCallback((nextSession) => {
    if (!mountedRef.current) return;
    setSession(nextSession || null);
    setUser(nextSession?.user || null);
    setAuthLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      applySession(data.session);
      return data.session;
    } catch (error) {
      if (mountedRef.current) {
        setAuthError(error?.message || "Could not restore your session.");
        applySession(null);
      }
      return null;
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    setAuthError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message || "Could not sign out.");
      return false;
    }
    clearClientCaches();
    setAuthEvent("SIGNED_OUT");
    applySession(null);
    return true;
  }, [applySession]);

  useEffect(() => {
    mountedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        setAuthLoading(false);
        setAuthError((current) => current || "Session restoration took too long. Refresh or sign in again.");
      }
    }, 12_000);

    void refreshSession().finally(() => window.clearTimeout(timeoutId));

    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mountedRef.current) return;
      setAuthEvent(event);
      applySession(currentSession);
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        clearClientCaches();
      }
      if (event === "TOKEN_REFRESHED") {
        setAuthError("");
      }
    });

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeoutId);
      data.subscription.unsubscribe();
    };
  }, [applySession, refreshSession]);

  const value = useMemo(() => ({
    session,
    user,
    authLoading,
    authError,
    authEvent,
    refreshSession,
    signOut,
  }), [session, user, authLoading, authError, authEvent, refreshSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
