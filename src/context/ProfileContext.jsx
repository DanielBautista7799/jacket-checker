import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";

export const ProfileContext = createContext(null);

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 5 * 60 * 1000;
const inFlightProfileRequests = new Map();

function getCacheKey(userId) {
  return `jacket-check:profile:v${CACHE_VERSION}:${userId}`;
}

function readCache(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(getCacheKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return {
      profile: parsed.profile ?? null,
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch (error) {
    console.error("Could not read profile cache:", error);
    return null;
  }
}

function writeCache(userId, profile) {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({
        profile,
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error("Could not write profile cache:", error);
  }
}

function clearCache(userId) {
  if (!userId) {
    return;
  }

  try {
    localStorage.removeItem(getCacheKey(userId));
  } catch (error) {
    console.error("Could not clear profile cache:", error);
  }
}

async function requestProfile(userId) {
  if (inFlightProfileRequests.has(userId)) {
    return inFlightProfileRequests.get(userId);
  }

  const request = supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }

      return data;
    })
    .finally(() => {
      inFlightProfileRequests.delete(userId);
    });

  inFlightProfileRequests.set(userId, request);

  return request;
}

export function ProfileProvider({ children }) {
  const { user, authLoading } = useAuth();

  const initialCache = readCache(user?.id);

  const [profile, setProfile] = useState(
    initialCache?.profile ?? null
  );

  const [profileLoading, setProfileLoading] = useState(
    Boolean(user) && !initialCache
  );

  const [profileRefreshing, setProfileRefreshing] =
    useState(false);

  const [profileError, setProfileError] = useState("");

  const activeUserIdRef = useRef(user?.id || null);

  const fetchProfile = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!user?.id) {
        setProfile(null);
        setProfileLoading(false);
        setProfileRefreshing(false);
        return null;
      }

      const cached = readCache(user.id);
      const cacheIsFresh =
        cached &&
        Date.now() - cached.savedAt < CACHE_TTL_MS;

      if (!force && cacheIsFresh) {
        setProfile(cached.profile);
        setProfileLoading(false);
        return cached.profile;
      }

      if (silent || cached) {
        setProfileRefreshing(true);
      } else {
        setProfileLoading(true);
      }

      setProfileError("");

      try {
        const data = await requestProfile(user.id);

        if (activeUserIdRef.current !== user.id) {
          return null;
        }

        if (data) {
          writeCache(user.id, data);
        } else {
          clearCache(user.id);
        }

        setProfile(data);
        return data;
      } catch (error) {
        console.error("Profile fetch failed:", error);

        if (activeUserIdRef.current === user.id) {
          setProfileError(
            error.message || "Could not fetch profile."
          );
        }

        return cached?.profile ?? null;
      } finally {
        if (activeUserIdRef.current === user.id) {
          setProfileLoading(false);
          setProfileRefreshing(false);
        }
      }
    },
    [user]
  );

  const saveProfile = useCallback(
    async (profileData) => {
      if (!user?.id) {
        return null;
      }

      setProfileLoading(true);
      setProfileError("");

      try {
        const payload = {
          id: user.id,
          email: user.email,
          ...profileData,
        };

        const { data, error } = await supabase
          .from("profiles")
          .upsert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        writeCache(user.id, data);
        setProfile(data);

        return data;
      } catch (error) {
        console.error("Profile save failed:", error);

        setProfileError(
          error.message || "Could not save profile."
        );

        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    activeUserIdRef.current = user?.id || null;

    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      setProfileRefreshing(false);
      setProfileError("");
      return;
    }

    const cached = readCache(user.id);

    if (cached) {
      setProfile(cached.profile);
      setProfileLoading(false);

      fetchProfile({
        silent: true,
      });
    } else {
      setProfile(null);
      fetchProfile();
    }
  }, [authLoading, user?.id, fetchProfile]);

  const value = useMemo(
    () => ({
      profile,
      profileLoading,
      profileRefreshing,
      profileError,
      fetchProfile,
      saveProfile,
    }),
    [
      profile,
      profileLoading,
      profileRefreshing,
      profileError,
      fetchProfile,
      saveProfile,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
