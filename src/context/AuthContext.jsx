import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import { completeNativeAuthCallback } from "../utils/nativeAuthCallback";
import clearClientCaches from "../utils/clearClientCaches";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] =
    useState(true);
  const [authError, setAuthError] =
    useState("");
  const [authEvent, setAuthEvent] =
    useState("");
  const [recoverySession, setRecoverySession] =
    useState(false);

  const mountedRef = useRef(true);

  const applySession = useCallback(
    (nextSession) => {
      if (!mountedRef.current) {
        return;
      }

      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setAuthLoading(false);
    },
    [],
  );

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const clearRecoverySession =
    useCallback(() => {
      setRecoverySession(false);
    }, []);

  const refreshSession = useCallback(
    async () => {
      setAuthError("");

      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        applySession(data.session);

        return data.session;
      } catch (error) {
        if (mountedRef.current) {
          setAuthError(
            error?.message ||
              "Could not restore your session.",
          );

          applySession(null);
        }

        return null;
      }
    },
    [applySession],
  );

  const completeAuthCallback = useCallback(
    async (url) => {
      setAuthLoading(true);
      setAuthError("");

      try {
        const result =
          await completeNativeAuthCallback(url);

        if (!result.handled) {
          setAuthLoading(false);
          return result;
        }

        applySession(result.session);

        if (result.intent === "recovery") {
          setRecoverySession(true);
          setAuthEvent("PASSWORD_RECOVERY");
        } else if (
          result.intent === "email-change"
        ) {
          setRecoverySession(false);
          setAuthEvent("USER_UPDATED");
        } else {
          setRecoverySession(false);
          setAuthEvent("SIGNED_IN");
        }

        return {
          ...result,
          error: "",
        };
      } catch (error) {
        const message =
          error?.message ||
          "The authentication link could not be completed.";

        if (mountedRef.current) {
          setAuthLoading(false);
          setRecoverySession(false);
          setAuthEvent(
            "AUTH_CALLBACK_ERROR",
          );
          setAuthError(message);
        }

        return {
          handled: true,
          destination: "/auth",
          error: message,
        };
      }
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    setAuthError("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      setAuthError(
        error.message ||
          "Could not sign out.",
      );

      return false;
    }

    clearClientCaches();
    setRecoverySession(false);
    setAuthEvent("SIGNED_OUT");
    applySession(null);

    return true;
  }, [applySession]);

  useEffect(() => {
    mountedRef.current = true;

    const timeoutId = window.setTimeout(
      () => {
        if (mountedRef.current) {
          setAuthLoading(false);

          setAuthError(
            (current) =>
              current ||
              "Session restoration took too long. Refresh or sign in again.",
          );
        }
      },
      12_000,
    );

    void refreshSession().finally(() =>
      window.clearTimeout(timeoutId),
    );

    const { data } =
      supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          if (!mountedRef.current) {
            return;
          }

          setAuthEvent(event);
          applySession(currentSession);

          if (event === "PASSWORD_RECOVERY") {
            setRecoverySession(true);
          }

          if (
            event === "SIGNED_OUT" ||
            event === "USER_DELETED"
          ) {
            setRecoverySession(false);
            clearClientCaches();
          }

          if (event === "TOKEN_REFRESHED") {
            setAuthError("");
          }
        },
      );

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeoutId);
      data.subscription.unsubscribe();
    };
  }, [applySession, refreshSession]);

  const value = useMemo(
    () => ({
      session,
      user,
      authLoading,
      authError,
      authEvent,
      recoverySession,
      refreshSession,
      completeAuthCallback,
      clearAuthError,
      clearRecoverySession,
      signOut,
    }),
    [
      session,
      user,
      authLoading,
      authError,
      authEvent,
      recoverySession,
      refreshSession,
      completeAuthCallback,
      clearAuthError,
      clearRecoverySession,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}