import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

export const DeveloperAccessContext = createContext(null);

function getHttpStatus(error) {
  if (typeof error?.context?.status === "number") return error.context.status;
  if (typeof error?.status === "number") return error.status;
  return null;
}

const EMPTY_ACCESS = {
  isDeveloper: false,
  developerRole: null,
  developerAccessSource: null,
  developerNeedsBootstrap: false,
  canManageDeveloperAccess: false,
  developerPages: [],
};

export function DeveloperAccessProvider({ children }) {
  const { user, session, authLoading } = useAuth();
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [developerLoading, setDeveloperLoading] = useState(false);
  const [developerError, setDeveloperError] = useState("");
  const requestSequenceRef = useRef(0);

  const refreshDeveloperAccess = useCallback(async () => {
    const userId = user?.id || "";
    const accessToken = session?.access_token || "";
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;

    if (!userId || !accessToken) {
      setAccess(EMPTY_ACCESS);
      setDeveloperLoading(false);
      setDeveloperError("");
      return false;
    }

    setDeveloperLoading(true);
    setDeveloperError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "get-developer-access",
        {
          body: { action: "check" },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (requestSequenceRef.current !== requestSequence) return false;

      if (error) {
        const status = getHttpStatus(error);
        setAccess(EMPTY_ACCESS);
        setDeveloperError(
          status === 401 || status === 403
            ? ""
            : "Developer access could not be verified. Check the Edge Function deployment and try again.",
        );
        return false;
      }

      const allowed = data?.authorized === true;
      setAccess(
        allowed
          ? {
              isDeveloper: true,
              developerRole: data?.role === "owner" ? "owner" : "admin",
              developerAccessSource: data?.source || "registry",
              developerNeedsBootstrap: data?.needsBootstrap === true,
              canManageDeveloperAccess: data?.canManageAccess === true,
              developerPages: Array.isArray(data?.pages) ? data.pages : [],
            }
          : EMPTY_ACCESS,
      );
      setDeveloperError("");
      return allowed;
    } catch {
      if (requestSequenceRef.current !== requestSequence) return false;
      setAccess(EMPTY_ACCESS);
      setDeveloperError(
        "Developer access could not be verified. Check your connection and try again.",
      );
      return false;
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        setDeveloperLoading(false);
      }
    }
  }, [session?.access_token, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void refreshDeveloperAccess();
  }, [authLoading, refreshDeveloperAccess]);

  const value = useMemo(
    () => ({
      ...access,
      developerLoading: authLoading || developerLoading,
      developerError,
      refreshDeveloperAccess,
    }),
    [
      access,
      authLoading,
      developerError,
      developerLoading,
      refreshDeveloperAccess,
    ],
  );

  return (
    <DeveloperAccessContext.Provider value={value}>
      {children}
    </DeveloperAccessContext.Provider>
  );
}
