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

import {
  createClosetImageUrl,
  deleteClosetImage,
  uploadClosetImage,
} from "../utils/uploadClosetImage";

export const ClosetContext = createContext(null);

const CACHE_VERSION = 2;
const CACHE_TTL_MS = 5 * 60 * 1000;
const SIGNED_URL_TTL_MS = 45 * 60 * 1000;

const inFlightClosetRequests = new Map();
const signedImageCache = new Map();

function getCacheKey(userId) {
  return `jacket-check:closet:v${CACHE_VERSION}:${userId}`;
}

function readCache(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(
      getCacheKey(userId)
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return {
      items: Array.isArray(parsed.items)
        ? parsed.items
        : [],
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch (error) {
    console.error(
      "Could not read closet cache:",
      error
    );
    return null;
  }
}

function writeCache(userId, items) {
  if (!userId) {
    return;
  }

  const serializableItems = items.map(
    (item) => ({
      ...item,
      image_url: null,
    })
  );

  try {
    localStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({
        items: serializableItems,
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "Could not write closet cache:",
      error
    );
  }
}

async function getSignedImageUrl(
  imagePath,
  force = false
) {
  if (!imagePath) {
    return null;
  }

  const cached = signedImageCache.get(imagePath);

  if (
    !force &&
    cached &&
    Date.now() - cached.savedAt < SIGNED_URL_TTL_MS
  ) {
    return cached.url;
  }

  const url = await createClosetImageUrl(imagePath);

  signedImageCache.set(imagePath, {
    url,
    savedAt: Date.now(),
  });

  return url;
}

async function hydrateImages(items, force = false) {
  return Promise.all(
    items.map(async (item) => {
      if (!item.image_path) {
        return {
          ...item,
          image_url: null,
        };
      }

      try {
        return {
          ...item,
          image_url: await getSignedImageUrl(
            item.image_path,
            force
          ),
        };
      } catch (error) {
        console.error(
          "Could not create closet image URL:",
          error
        );

        return {
          ...item,
          image_url: null,
        };
      }
    })
  );
}

async function requestCloset(userId) {
  if (inFlightClosetRequests.has(userId)) {
    return inFlightClosetRequests.get(userId);
  }

  const request = supabase
    .from("closet_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }

      return data || [];
    })
    .finally(() => {
      inFlightClosetRequests.delete(userId);
    });

  inFlightClosetRequests.set(userId, request);

  return request;
}

export function ClosetProvider({ children }) {
  const { user, authLoading } = useAuth();

  const [closetItems, setClosetItems] = useState([]);

  const [closetLoading, setClosetLoading] =
    useState(Boolean(user));

  const [closetRefreshing, setClosetRefreshing] =
    useState(false);

  const [closetError, setClosetError] =
    useState("");

  const activeUserIdRef = useRef(user?.id || null);

  const commitItems = useCallback((updater) => {
    setClosetItems((current) => {
      const next =
        typeof updater === "function"
          ? updater(current)
          : updater;

      if (activeUserIdRef.current) {
        writeCache(activeUserIdRef.current, next);
      }

      return next;
    });
  }, []);

  const fetchClosetItems = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!user?.id) {
        setClosetItems([]);
        setClosetLoading(false);
        setClosetRefreshing(false);
        return [];
      }

      const cached = readCache(user.id);
      const cacheIsFresh =
        cached &&
        Date.now() - cached.savedAt < CACHE_TTL_MS;

      if (!force && cacheIsFresh) {
        setClosetLoading(true);

        const hydrated = await hydrateImages(
          cached.items
        );

        if (activeUserIdRef.current === user.id) {
          commitItems(hydrated);
          setClosetLoading(false);
        }

        return hydrated;
      }

      if (silent || cached) {
        setClosetRefreshing(true);
      } else {
        setClosetLoading(true);
      }

      setClosetError("");

      try {
        const rows = await requestCloset(user.id);
        const hydrated = await hydrateImages(
          rows,
          force
        );

        if (activeUserIdRef.current !== user.id) {
          return [];
        }

        commitItems(hydrated);
        return hydrated;
      } catch (error) {
        console.error("Closet fetch failed:", error);

        if (activeUserIdRef.current === user.id) {
          setClosetError(
            error.message ||
              "Could not fetch closet items."
          );
        }

        return cached?.items || [];
      } finally {
        if (activeUserIdRef.current === user.id) {
          setClosetLoading(false);
          setClosetRefreshing(false);
        }
      }
    },
    [user, commitItems]
  );

  const refreshClosetImages = useCallback(async () => {
    if (!user?.id) {
      return [];
    }

    setClosetRefreshing(true);

    try {
      const hydrated = await hydrateImages(
        closetItems,
        true
      );

      commitItems(hydrated);
      return hydrated;
    } catch (error) {
      console.error(
        "Could not refresh closet images:",
        error
      );

      return closetItems;
    } finally {
      setClosetRefreshing(false);
    }
  }, [user?.id, closetItems, commitItems]);

  const saveClosetItem = useCallback(
    async (itemData, imageFile = null) => {
      if (!user?.id) {
        setClosetError(
          "You must be signed in to save closet items."
        );
        return null;
      }

      setClosetLoading(true);
      setClosetError("");

      let uploadedImagePath = null;

      try {
        if (imageFile) {
          uploadedImagePath = await uploadClosetImage({
            file: imageFile,
            userId: user.id,
          });
        }

        const payload = {
          user_id: user.id,
          ...itemData,
          image_path: uploadedImagePath,
          image_url: null,
          times_recommended:
            Number(itemData.times_recommended) || 0,
        };

        const { data, error } = await supabase
          .from("closet_items")
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const hydratedItem = {
          ...data,
          image_url: data.image_path
            ? await getSignedImageUrl(
                data.image_path,
                true
              )
            : null,
        };

        commitItems((current) => [
          hydratedItem,
          ...current,
        ]);

        return hydratedItem;
      } catch (error) {
        console.error("Closet save failed:", error);

        if (uploadedImagePath) {
          try {
            await deleteClosetImage(uploadedImagePath);
          } catch (cleanupError) {
            console.error(
              "Failed to clean up uploaded image:",
              cleanupError
            );
          }
        }

        setClosetError(
          error.message ||
            "Could not save closet item."
        );

        return null;
      } finally {
        setClosetLoading(false);
      }
    },
    [user, commitItems]
  );

  const updateClosetItem = useCallback(
    async (
      itemId,
      itemData,
      replacementImageFile = null
    ) => {
      if (!user?.id || !itemId) {
        return null;
      }

      const existingItem = closetItems.find(
        (item) => item.id === itemId
      );

      if (!existingItem) {
        setClosetError(
          "Could not find the jacket to update."
        );
        return null;
      }

      setClosetLoading(true);
      setClosetError("");

      let newImagePath = null;

      try {
        if (replacementImageFile) {
          newImagePath = await uploadClosetImage({
            file: replacementImageFile,
            userId: user.id,
          });
        }

        const payload = {
          ...itemData,
          image_path:
            newImagePath ||
            existingItem.image_path ||
            null,
          image_url: null,
        };

        const { data, error } = await supabase
          .from("closet_items")
          .update(payload)
          .eq("id", itemId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (
          newImagePath &&
          existingItem.image_path &&
          existingItem.image_path !== newImagePath
        ) {
          signedImageCache.delete(
            existingItem.image_path
          );

          try {
            await deleteClosetImage(
              existingItem.image_path
            );
          } catch (cleanupError) {
            console.error(
              "Jacket updated, but old image cleanup failed:",
              cleanupError
            );
          }
        }

        const hydratedItem = {
          ...data,
          image_url: data.image_path
            ? await getSignedImageUrl(
                data.image_path,
                true
              )
            : null,
        };

        commitItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? hydratedItem
              : item
          )
        );

        return hydratedItem;
      } catch (error) {
        console.error("Closet update failed:", error);

        if (newImagePath) {
          signedImageCache.delete(newImagePath);

          try {
            await deleteClosetImage(newImagePath);
          } catch (cleanupError) {
            console.error(
              "Could not clean up replacement image:",
              cleanupError
            );
          }
        }

        setClosetError(
          error.message ||
            "Could not update closet item."
        );

        return null;
      } finally {
        setClosetLoading(false);
      }
    },
    [user, closetItems, commitItems]
  );

  const deleteClosetItem = useCallback(
    async (itemId) => {
      if (!user?.id) {
        return false;
      }

      const itemToDelete = closetItems.find(
        (item) => item.id === itemId
      );

      if (!itemToDelete) {
        return false;
      }

      setClosetLoading(true);
      setClosetError("");

      try {
        const { error } = await supabase
          .from("closet_items")
          .delete()
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        commitItems((current) =>
          current.filter((item) => item.id !== itemId)
        );

        if (itemToDelete.image_path) {
          signedImageCache.delete(
            itemToDelete.image_path
          );

          try {
            await deleteClosetImage(
              itemToDelete.image_path
            );
          } catch (imageError) {
            console.error(
              "Database item deleted, but image cleanup failed:",
              imageError
            );
          }
        }

        return true;
      } catch (error) {
        console.error("Closet delete failed:", error);

        setClosetError(
          error.message ||
            "Could not delete closet item."
        );

        return false;
      } finally {
        setClosetLoading(false);
      }
    },
    [user, closetItems, commitItems]
  );

  const adjustTimesRecommended = useCallback(
    async (itemId, amount) => {
      if (!user?.id || !itemId || amount === 0) {
        return false;
      }

      const item = closetItems.find(
        (closetItem) => closetItem.id === itemId
      );

      if (!item) {
        return false;
      }

      const previousScore = Number(
        item.times_recommended || 0
      );

      const nextScore = previousScore + amount;

      commitItems((current) =>
        current.map((closetItem) =>
          closetItem.id === itemId
            ? {
                ...closetItem,
                times_recommended: nextScore,
              }
            : closetItem
        )
      );

      try {
        const { error } = await supabase
          .from("closet_items")
          .update({
            times_recommended: nextScore,
          })
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        return true;
      } catch (error) {
        console.error(
          "Could not update recommendation score:",
          error
        );

        commitItems((current) =>
          current.map((closetItem) =>
            closetItem.id === itemId
              ? {
                  ...closetItem,
                  times_recommended: previousScore,
                }
              : closetItem
          )
        );

        setClosetError(
          error.message ||
            "Could not update the jacket preference score."
        );

        return false;
      }
    },
    [user, closetItems, commitItems]
  );

  useEffect(() => {
    activeUserIdRef.current = user?.id || null;

    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setClosetItems([]);
      setClosetLoading(false);
      setClosetRefreshing(false);
      setClosetError("");
      return;
    }

    const cached = readCache(user.id);

    const initialize = async () => {
      setClosetLoading(true);

      if (cached?.items?.length) {
        const hydrated = await hydrateImages(
          cached.items
        );

        if (activeUserIdRef.current === user.id) {
          commitItems(hydrated);
        }
      }

      await fetchClosetItems({
        silent: Boolean(cached),
      });
    };

    initialize();
  }, [
    authLoading,
    user?.id,
    fetchClosetItems,
    commitItems,
  ]);

  const value = useMemo(
    () => ({
      closetItems,
      closetLoading,
      closetRefreshing,
      closetError,
      fetchClosetItems,
      refreshClosetImages,
      saveClosetItem,
      updateClosetItem,
      deleteClosetItem,
      adjustTimesRecommended,
    }),
    [
      closetItems,
      closetLoading,
      closetRefreshing,
      closetError,
      fetchClosetItems,
      refreshClosetImages,
      saveClosetItem,
      updateClosetItem,
      deleteClosetItem,
      adjustTimesRecommended,
    ]
  );

  return (
    <ClosetContext.Provider value={value}>
      {children}
    </ClosetContext.Provider>
  );
}
