/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
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
  MAX_WARDROBE_IMAGES_PER_ITEM,
  createWardrobeImageUrl,
  deleteWardrobeImagePaths,
  uploadWardrobeImage,
  uploadWardrobeImages,
  validateWardrobeImages,
} from "../utils/wardrobeImageStorage";

export const WardrobeContext = createContext(null);

const CACHE_VERSION = 2;
const CACHE_TTL_MS = 5 * 60 * 1000;
const SIGNED_URL_TTL_MS = 45 * 60 * 1000;
const SIGNED_URL_REFRESH_INTERVAL_MS = 35 * 60 * 1000;
const SIGNED_URL_STALE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const inFlightWardrobeRequests = new Map();
const signedImageCache = new Map();

function getCacheKey(userId) {
  return `jacket-check:wardrobe:v${CACHE_VERSION}:${userId}`;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeWardrobeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  return {
    ...image,
    display_order: Math.max(
      0,
      normalizeNumber(image.display_order, 0)
    ),
    is_primary: Boolean(image.is_primary),
    processed_image_path: image.processed_image_path || null,
    image_url: image.image_url || null,
    processed_image_url: image.processed_image_url || null,
  };
}

function sortWardrobeImages(images) {
  return [...images].sort((first, second) => {
    const orderDifference =
      normalizeNumber(first.display_order, 0) -
      normalizeNumber(second.display_order, 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    const createdDifference = String(first.created_at || "").localeCompare(
      String(second.created_at || "")
    );

    if (createdDifference !== 0) {
      return createdDifference;
    }

    return String(first.id || "").localeCompare(String(second.id || ""));
  });
}

function normalizeWardrobeItem(item) {
  const preferenceScore = normalizeNumber(item?.preference_score, 0);

  const recommendationCount = normalizeNumber(
    item?.recommendation_count ?? item?.times_recommended,
    0
  );

  const subtype = item?.subtype || item?.type || "other";
  const primaryColor = item?.primary_color || item?.color || "other";

  const images = sortWardrobeImages(
    normalizeArray(item?.images)
      .map(normalizeWardrobeImage)
      .filter(Boolean)
  );

  const primaryImage =
    images.find((image) => image.is_primary) || images[0] || null;

  const primaryImagePath = primaryImage?.image_path || item?.image_path || null;
  const primaryImageUrl = primaryImage?.image_url || item?.image_url || null;

  return {
    ...item,
    category: item?.category || "jacket",
    subtype,
    primary_color: primaryColor,
    materials: normalizeArray(item?.materials),
    style_tags: normalizeArray(item?.style_tags),
    weather_use: normalizeArray(item?.weather_use),
    favorite: Boolean(item?.favorite),
    archived: Boolean(item?.archived),
    preference_score: preferenceScore,
    recommendation_count: recommendationCount,

    images,
    primary_image: primaryImage,
    image_count: images.length,
    image_path: primaryImagePath,
    image_url: primaryImageUrl,

    type: subtype,
    color: primaryColor,
    times_recommended: preferenceScore,

    ai_original_result:
      item?.original_ai_json ?? item?.ai_original_result ?? null,
  };
}

function buildWardrobePayload(itemData, existingItem = null) {
  const source = itemData || {};
  const existing = existingItem || {};

  const aiGenerated = Boolean(
    source.ai_generated ?? existing.ai_generated ?? false
  );

  const secondaryColor =
    source.secondary_color ?? existing.secondary_color ?? null;

  const recommendationCount = normalizeNumber(
    source.recommendation_count ?? existing.recommendation_count,
    0
  );

  const preferenceScore = normalizeNumber(
    source.preference_score ??
      source.times_recommended ??
      existing.preference_score ??
      existing.times_recommended,
    0
  );

  return {
    name: String(source.name ?? existing.name ?? "").trim(),

    category: source.category ?? existing.category ?? "jacket",

    subtype:
      source.subtype ??
      source.type ??
      existing.subtype ??
      existing.type ??
      "other",

    primary_color:
      source.primary_color ??
      source.color ??
      existing.primary_color ??
      existing.color ??
      "other",

    secondary_color:
      typeof secondaryColor === "string" && secondaryColor.trim()
        ? secondaryColor.trim()
        : null,

    materials: normalizeArray(source.materials ?? existing.materials),

    warmth_rating: normalizeNumber(
      source.warmth_rating ?? existing.warmth_rating,
      1
    ),

    rain_rating: normalizeNumber(
      source.rain_rating ?? existing.rain_rating,
      1
    ),

    wind_rating: normalizeNumber(
      source.wind_rating ?? existing.wind_rating,
      1
    ),

    formality_rating: normalizeNumber(
      source.formality_rating ?? existing.formality_rating,
      1
    ),

    fit: source.fit ?? existing.fit ?? "regular",

    style_tags: normalizeArray(source.style_tags ?? existing.style_tags),

    weather_use: normalizeArray(source.weather_use ?? existing.weather_use),

    description:
      source.description !== undefined
        ? source.description
        : existing.description ?? null,

    favorite: Boolean(source.favorite ?? existing.favorite ?? false),

    archived: Boolean(source.archived ?? existing.archived ?? false),

    times_recommended: recommendationCount,
    preference_score: preferenceScore,
    ai_generated: aiGenerated,

    ai_provider:
      source.ai_provider ??
      existing.ai_provider ??
      (aiGenerated ? "gemini" : null),

    ai_model: source.ai_model ?? existing.ai_model ?? null,

    ai_confidence:
      source.ai_confidence !== undefined
        ? source.ai_confidence
        : existing.ai_confidence ?? null,

    original_ai_json:
      source.original_ai_json ??
      source.ai_original_result ??
      existing.original_ai_json ??
      existing.ai_original_result ??
      null,

    confirmed_by_user: source.confirmed_by_user ?? true,
  };
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
      items: Array.isArray(parsed.items)
        ? parsed.items.map(normalizeWardrobeItem)
        : [],
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch (error) {
    console.error("Could not read wardrobe cache:", error);
    return null;
  }
}

function writeCache(userId, items) {
  if (!userId) {
    return;
  }

  const serializableItems = items.map((item) => ({
    ...item,
    image_url: null,
    primary_image: item.primary_image
      ? {
          ...item.primary_image,
          image_url: null,
          processed_image_url: null,
        }
      : null,
    images: normalizeArray(item.images).map((image) => ({
      ...image,
      image_url: null,
      processed_image_url: null,
    })),
  }));

  try {
    localStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({
        items: serializableItems,
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error("Could not write wardrobe cache:", error);
  }
}

function clearSignedImageCache(paths) {
  normalizeArray(paths)
    .filter(Boolean)
    .forEach((path) => signedImageCache.delete(path));
}

async function getSignedImageUrl(imagePath, force = false) {
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

  const url = await createWardrobeImageUrl(imagePath);

  signedImageCache.set(imagePath, {
    url,
    savedAt: Date.now(),
  });

  return url;
}

async function hydrateWardrobeImage(image, force = false) {
  const normalized = normalizeWardrobeImage(image);

  if (!normalized) {
    return null;
  }

  let imageUrl = null;
  let processedImageUrl = null;

  try {
    imageUrl = await getSignedImageUrl(normalized.image_path, force);
  } catch (error) {
    console.error("Could not create wardrobe image URL:", error);
  }

  if (normalized.processed_image_path) {
    try {
      processedImageUrl = await getSignedImageUrl(
        normalized.processed_image_path,
        force
      );
    } catch (error) {
      console.error("Could not create processed wardrobe image URL:", error);
    }
  }

  return {
    ...normalized,
    image_url: imageUrl,
    processed_image_url: processedImageUrl,
  };
}

async function hydrateImages(items, force = false) {
  return Promise.all(
    items.map(async (rawItem) => {
      const normalizedItem = normalizeWardrobeItem(rawItem);
      const hydratedImages = (
        await Promise.all(
          normalizedItem.images.map((image) =>
            hydrateWardrobeImage(image, force)
          )
        )
      ).filter(Boolean);

      if (hydratedImages.length > 0) {
        return normalizeWardrobeItem({
          ...normalizedItem,
          images: hydratedImages,
        });
      }

      if (!normalizedItem.image_path) {
        return normalizeWardrobeItem({
          ...normalizedItem,
          image_url: null,
        });
      }

      try {
        return normalizeWardrobeItem({
          ...normalizedItem,
          image_url: await getSignedImageUrl(
            normalizedItem.image_path,
            force
          ),
        });
      } catch (error) {
        console.error("Could not create legacy wardrobe image URL:", error);

        return normalizeWardrobeItem({
          ...normalizedItem,
          image_url: null,
        });
      }
    })
  );
}

function attachImagesToItems(items, images) {
  const imagesByItemId = new Map();

  images.forEach((image) => {
    const normalized = normalizeWardrobeImage(image);

    if (!normalized?.wardrobe_item_id) {
      return;
    }

    const current = imagesByItemId.get(normalized.wardrobe_item_id) || [];
    current.push(normalized);
    imagesByItemId.set(normalized.wardrobe_item_id, current);
  });

  return items.map((item) =>
    normalizeWardrobeItem({
      ...item,
      images: sortWardrobeImages(imagesByItemId.get(item.id) || []),
    })
  );
}

async function requestWardrobe(userId) {
  if (inFlightWardrobeRequests.has(userId)) {
    return inFlightWardrobeRequests.get(userId);
  }

  const request = Promise.all([
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("wardrobe_item_images")
      .select("*")
      .eq("user_id", userId)
      .order("wardrobe_item_id", { ascending: true })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ])
    .then(([itemsResult, imagesResult]) => {
      if (itemsResult.error) {
        throw itemsResult.error;
      }

      if (imagesResult.error) {
        const error = new Error(
          imagesResult.error.message ||
            "Could not load wardrobe images. Confirm Phase 4.1 is applied."
        );

        error.code = imagesResult.error.code;
        throw error;
      }

      return attachImagesToItems(itemsResult.data || [], imagesResult.data || []);
    })
    .finally(() => {
      inFlightWardrobeRequests.delete(userId);
    });

  inFlightWardrobeRequests.set(userId, request);
  return request;
}

async function requestSingleWardrobeItem(userId, itemId) {
  const [itemResult, imagesResult] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single(),

    supabase
      .from("wardrobe_item_images")
      .select("*")
      .eq("wardrobe_item_id", itemId)
      .eq("user_id", userId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (itemResult.error) {
    throw itemResult.error;
  }

  if (imagesResult.error) {
    throw imagesResult.error;
  }

  return normalizeWardrobeItem({
    ...itemResult.data,
    images: imagesResult.data || [],
  });
}

function getImageStoragePaths(images, legacyPath = null) {
  return [
    ...new Set(
      [
        ...normalizeArray(images).flatMap((image) => [
          image?.image_path,
          image?.processed_image_path,
        ]),
        legacyPath,
      ].filter(Boolean)
    ),
  ];
}

export function WardrobeProvider({ children }) {
  const { user, authLoading } = useAuth();

  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(Boolean(user));
  const [wardrobeRefreshing, setWardrobeRefreshing] = useState(false);
  const [wardrobeError, setWardrobeError] = useState("");

  const [wardrobeImageLoading, setWardrobeImageLoading] = useState(false);
  const [wardrobeImageError, setWardrobeImageError] = useState("");

  const activeUserIdRef = useRef(user?.id || null);
  const imageRefreshPromiseRef = useRef(null);
  const lastFullImageRefreshAtRef = useRef(0);

  const commitItems = useCallback((updater) => {
    setWardrobeItems((current) => {
      const nextValue =
        typeof updater === "function" ? updater(current) : updater;

      const next = nextValue.map(normalizeWardrobeItem);

      if (activeUserIdRef.current) {
        writeCache(activeUserIdRef.current, next);
      }

      return next;
    });
  }, []);

  const refreshSingleWardrobeItem = useCallback(
    async (itemId, force = true) => {
      if (!user?.id || !itemId) {
        return null;
      }

      const row = await requestSingleWardrobeItem(user.id, itemId);
      const hydratedItem = (await hydrateImages([row], force))[0];

      commitItems((current) => {
        const exists = current.some((item) => item.id === itemId);

        if (!exists) {
          return [hydratedItem, ...current];
        }

        return current.map((item) =>
          item.id === itemId ? hydratedItem : item
        );
      });

      return hydratedItem;
    },
    [user, commitItems]
  );

  const fetchWardrobeItems = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!user?.id) {
        setWardrobeItems([]);
        setWardrobeLoading(false);
        setWardrobeRefreshing(false);
        return [];
      }

      const cached = readCache(user.id);
      const cacheIsFresh =
        cached && Date.now() - cached.savedAt < CACHE_TTL_MS;

      if (!force && cacheIsFresh) {
        setWardrobeLoading(true);

        const hydrated = await hydrateImages(cached.items);
        lastFullImageRefreshAtRef.current = Date.now();

        if (activeUserIdRef.current === user.id) {
          commitItems(hydrated);
          setWardrobeLoading(false);
        }

        return hydrated;
      }

      if (silent || cached) {
        setWardrobeRefreshing(true);
      } else {
        setWardrobeLoading(true);
      }

      setWardrobeError("");

      try {
        const rows = await requestWardrobe(user.id);
        const hydrated = await hydrateImages(rows, force);
        lastFullImageRefreshAtRef.current = Date.now();

        if (activeUserIdRef.current !== user.id) {
          return [];
        }

        commitItems(hydrated);
        return hydrated;
      } catch (error) {
        console.error("Wardrobe fetch failed:", error);

        if (activeUserIdRef.current === user.id) {
          setWardrobeError(
            error.message || "Could not fetch wardrobe items."
          );
        }

        return cached?.items || [];
      } finally {
        if (activeUserIdRef.current === user.id) {
          setWardrobeLoading(false);
          setWardrobeRefreshing(false);
        }
      }
    },
    [user, commitItems]
  );

  const refreshWardrobeImages = useCallback(async () => {
    if (!user?.id) {
      return [];
    }

    if (imageRefreshPromiseRef.current) {
      return imageRefreshPromiseRef.current;
    }

    const activeUserId = user.id;

    const refreshRequest = (async () => {
      setWardrobeRefreshing(true);

      try {
        const hydrated = await hydrateImages(wardrobeItems, true);

        if (activeUserIdRef.current !== activeUserId) {
          return [];
        }

        lastFullImageRefreshAtRef.current = Date.now();
        commitItems(hydrated);
        return hydrated;
      } catch (error) {
        console.error("Could not refresh wardrobe images:", error);
        return wardrobeItems;
      } finally {
        if (activeUserIdRef.current === activeUserId) {
          setWardrobeRefreshing(false);
        }

        imageRefreshPromiseRef.current = null;
      }
    })();

    imageRefreshPromiseRef.current = refreshRequest;
    return refreshRequest;
  }, [user, wardrobeItems, commitItems]);

  const saveWardrobeItem = useCallback(
    async (itemData, imageFile = null) => {
      if (!user?.id) {
        setWardrobeError("You must be signed in to save wardrobe items.");
        return null;
      }

      setWardrobeLoading(true);
      setWardrobeError("");

      const itemId = crypto.randomUUID();
      let uploadedImagePath = null;
      let insertedItem = false;

      try {
        if (imageFile) {
          uploadedImagePath = await uploadWardrobeImage({
            file: imageFile,
            userId: user.id,
            itemId,
          });
        }

        const payload = {
          id: itemId,
          user_id: user.id,
          ...buildWardrobePayload(itemData),
          image_path: uploadedImagePath || itemData?.image_path || null,
        };

        const { error: itemError } = await supabase
          .from("wardrobe_items")
          .insert(payload);

        if (itemError) {
          throw itemError;
        }

        insertedItem = true;

        if (uploadedImagePath) {
          const { error: imageError } = await supabase
            .from("wardrobe_item_images")
            .insert({
              user_id: user.id,
              wardrobe_item_id: itemId,
              image_path: uploadedImagePath,
              processed_image_path: null,
              display_order: 0,
              is_primary: true,
            });

          if (imageError) {
            throw imageError;
          }
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Wardrobe save failed:", error);

        if (insertedItem) {
          try {
            await supabase
              .from("wardrobe_items")
              .delete()
              .eq("id", itemId)
              .eq("user_id", user.id);
          } catch (cleanupError) {
            console.error(
              "Could not roll back the failed wardrobe item:",
              cleanupError
            );
          }
        }

        if (uploadedImagePath) {
          clearSignedImageCache([uploadedImagePath]);

          try {
            await deleteWardrobeImagePaths([uploadedImagePath]);
          } catch (cleanupError) {
            console.error(
              "Failed to clean up uploaded wardrobe image:",
              cleanupError
            );
          }
        }

        setWardrobeError(error.message || "Could not save wardrobe item.");
        return null;
      } finally {
        setWardrobeLoading(false);
      }
    },
    [user, refreshSingleWardrobeItem]
  );

  const updateWardrobeItem = useCallback(
    async (itemId, itemData, replacementImageFile = null) => {
      if (!user?.id || !itemId) {
        return null;
      }

      const existingItem = wardrobeItems.find((item) => item.id === itemId);

      if (!existingItem) {
        setWardrobeError("Could not find the wardrobe item to update.");
        return null;
      }

      setWardrobeLoading(true);
      setWardrobeError("");

      let newImagePath = null;
      let updatedImageRow = null;
      let insertedImageRow = null;

      const existingPrimary =
        existingItem.primary_image ||
        existingItem.images.find((image) => image.is_primary) ||
        existingItem.images[0] ||
        null;

      try {
        if (replacementImageFile) {
          newImagePath = await uploadWardrobeImage({
            file: replacementImageFile,
            userId: user.id,
            itemId,
          });

          if (existingPrimary?.id) {
            const { data, error } = await supabase
              .from("wardrobe_item_images")
              .update({
                image_path: newImagePath,
                processed_image_path: null,
              })
              .eq("id", existingPrimary.id)
              .eq("wardrobe_item_id", itemId)
              .eq("user_id", user.id)
              .select()
              .single();

            if (error) {
              throw error;
            }

            updatedImageRow = data;
          } else {
            const nextOrder = existingItem.images.length;

            const { data, error } = await supabase
              .from("wardrobe_item_images")
              .insert({
                user_id: user.id,
                wardrobe_item_id: itemId,
                image_path: newImagePath,
                processed_image_path: null,
                display_order: nextOrder,
                is_primary: true,
              })
              .select()
              .single();

            if (error) {
              throw error;
            }

            insertedImageRow = data;
          }
        }

        const primaryPath =
          newImagePath ||
          existingPrimary?.image_path ||
          existingItem.image_path ||
          null;

        const payload = {
          ...buildWardrobePayload(itemData, existingItem),
          image_path: primaryPath,
        };

        const { error: itemError } = await supabase
          .from("wardrobe_items")
          .update(payload)
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (itemError) {
          throw itemError;
        }

        if (newImagePath && existingPrimary) {
          const oldPaths = [
            existingPrimary.image_path,
            existingPrimary.processed_image_path,
          ].filter((path) => path && path !== newImagePath);

          clearSignedImageCache(oldPaths);

          try {
            await deleteWardrobeImagePaths(oldPaths);
          } catch (cleanupError) {
            console.error(
              "Wardrobe item updated, but old image cleanup failed:",
              cleanupError
            );
          }
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Wardrobe update failed:", error);

        if (updatedImageRow && existingPrimary) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .update({
                image_path: existingPrimary.image_path,
                processed_image_path:
                  existingPrimary.processed_image_path || null,
              })
              .eq("id", updatedImageRow.id)
              .eq("user_id", user.id);
          } catch (rollbackError) {
            console.error(
              "Could not restore the previous primary image row:",
              rollbackError
            );
          }
        }

        if (insertedImageRow?.id) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .delete()
              .eq("id", insertedImageRow.id)
              .eq("user_id", user.id);
          } catch (rollbackError) {
            console.error(
              "Could not remove the failed replacement image row:",
              rollbackError
            );
          }
        }

        if (newImagePath) {
          clearSignedImageCache([newImagePath]);

          try {
            await deleteWardrobeImagePaths([newImagePath]);
          } catch (cleanupError) {
            console.error(
              "Could not clean up replacement wardrobe image:",
              cleanupError
            );
          }
        }

        setWardrobeError(error.message || "Could not update wardrobe item.");
        return null;
      } finally {
        setWardrobeLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const deleteWardrobeItem = useCallback(
    async (itemId) => {
      if (!user?.id) {
        return false;
      }

      const itemToDelete = wardrobeItems.find((item) => item.id === itemId);

      if (!itemToDelete) {
        return false;
      }

      setWardrobeLoading(true);
      setWardrobeError("");

      const storagePaths = getImageStoragePaths(
        itemToDelete.images,
        itemToDelete.image_path
      );

      try {
        const { error } = await supabase
          .from("wardrobe_items")
          .delete()
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        commitItems((current) =>
          current.filter((item) => item.id !== itemId)
        );

        clearSignedImageCache(storagePaths);

        try {
          await deleteWardrobeImagePaths(storagePaths);
        } catch (imageError) {
          console.error(
            "Database item deleted, but image cleanup failed:",
            imageError
          );
          setWardrobeError(
            "The item was deleted, but one or more private image files could not be removed. Try refreshing before uploading replacements."
          );
        }

        return true;
      } catch (error) {
        console.error("Wardrobe delete failed:", error);

        setWardrobeError(error.message || "Could not delete wardrobe item.");
        return false;
      } finally {
        setWardrobeLoading(false);
      }
    },
    [user, wardrobeItems, commitItems]
  );

  const getWardrobeItemImages = useCallback(
    (itemId) => {
      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );

      return item?.images || [];
    },
    [wardrobeItems]
  );

  const clearWardrobeImageError = useCallback(() => {
    setWardrobeImageError("");
  }, []);

  const addWardrobeImages = useCallback(
    async (itemId, files) => {
      if (!user?.id || !itemId) {
        return null;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );

      if (!item) {
        setWardrobeImageError("Could not find the wardrobe item.");
        return null;
      }

      const validation = validateWardrobeImages(files, {
        currentCount: item.images.length,
        maxImages: MAX_WARDROBE_IMAGES_PER_ITEM,
      });

      if (!validation.valid) {
        setWardrobeImageError(validation.error);
        return null;
      }

      setWardrobeImageLoading(true);
      setWardrobeImageError("");

      let uploadedPaths = [];
      let insertedRows = [];

      try {
        uploadedPaths = await uploadWardrobeImages({
          files: validation.files,
          userId: user.id,
          itemId,
          currentCount: item.images.length,
          maxImages: MAX_WARDROBE_IMAGES_PER_ITEM,
        });

        const highestOrder = item.images.reduce(
          (maximum, image) =>
            Math.max(maximum, normalizeNumber(image.display_order, 0)),
          -1
        );

        const needsPrimary = item.images.length === 0;

        const rows = uploadedPaths.map((imagePath, index) => ({
          user_id: user.id,
          wardrobe_item_id: itemId,
          image_path: imagePath,
          processed_image_path: null,
          display_order: highestOrder + index + 1,
          is_primary: needsPrimary && index === 0,
        }));

        const { data, error } = await supabase
          .from("wardrobe_item_images")
          .insert(rows)
          .select();

        if (error) {
          throw error;
        }

        insertedRows = data || [];

        if (needsPrimary) {
          const { error: itemError } = await supabase
            .from("wardrobe_items")
            .update({ image_path: uploadedPaths[0] })
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (itemError) {
            throw itemError;
          }
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Could not add wardrobe images:", error);

        if (insertedRows.length > 0) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .delete()
              .in(
                "id",
                insertedRows.map((row) => row.id)
              )
              .eq("user_id", user.id);
          } catch (rollbackError) {
            console.error(
              "Could not roll back added wardrobe image rows:",
              rollbackError
            );
          }
        }

        clearSignedImageCache(uploadedPaths);

        try {
          await deleteWardrobeImagePaths(uploadedPaths);
        } catch (cleanupError) {
          console.error(
            "Could not clean up added wardrobe image files:",
            cleanupError
          );
        }

        setWardrobeImageError(
          error.message || "Could not add wardrobe images."
        );
        return null;
      } finally {
        setWardrobeImageLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const setPrimaryWardrobeImage = useCallback(
    async (itemId, imageId) => {
      if (!user?.id || !itemId || !imageId) {
        return null;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );
      const targetImage = item?.images.find((image) => image.id === imageId);
      const previousPrimary = item?.primary_image || null;

      if (!item || !targetImage) {
        setWardrobeImageError("Could not find that wardrobe image.");
        return null;
      }

      if (targetImage.is_primary) {
        return item;
      }

      setWardrobeImageLoading(true);
      setWardrobeImageError("");

      let clearedPrevious = false;
      let setTarget = false;

      try {
        if (previousPrimary?.id) {
          const { error } = await supabase
            .from("wardrobe_item_images")
            .update({ is_primary: false })
            .eq("id", previousPrimary.id)
            .eq("wardrobe_item_id", itemId)
            .eq("user_id", user.id);

          if (error) {
            throw error;
          }

          clearedPrevious = true;
        }

        const { error: targetError } = await supabase
          .from("wardrobe_item_images")
          .update({ is_primary: true })
          .eq("id", imageId)
          .eq("wardrobe_item_id", itemId)
          .eq("user_id", user.id);

        if (targetError) {
          throw targetError;
        }

        setTarget = true;

        const { error: itemError } = await supabase
          .from("wardrobe_items")
          .update({ image_path: targetImage.image_path })
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (itemError) {
          throw itemError;
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Could not set primary wardrobe image:", error);

        if (setTarget) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .update({ is_primary: false })
              .eq("id", imageId)
              .eq("user_id", user.id);
          } catch (rollbackError) {
            console.error(
              "Could not clear the failed primary image:",
              rollbackError
            );
          }
        }

        if (clearedPrevious && previousPrimary?.id) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .update({ is_primary: true })
              .eq("id", previousPrimary.id)
              .eq("user_id", user.id);

            await supabase
              .from("wardrobe_items")
              .update({ image_path: previousPrimary.image_path })
              .eq("id", itemId)
              .eq("user_id", user.id);
          } catch (rollbackError) {
            console.error(
              "Could not restore the previous primary image:",
              rollbackError
            );
          }
        }

        setWardrobeImageError(
          error.message || "Could not set the primary image."
        );
        return null;
      } finally {
        setWardrobeImageLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const reorderWardrobeImages = useCallback(
    async (itemId, orderedImageIds) => {
      if (!user?.id || !itemId) {
        return null;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );

      if (!item) {
        setWardrobeImageError("Could not find the wardrobe item.");
        return null;
      }

      const uniqueIds = [...new Set(normalizeArray(orderedImageIds))];
      const currentIds = new Set(item.images.map((image) => image.id));

      const orderIsValid =
        uniqueIds.length === item.images.length &&
        uniqueIds.every((imageId) => currentIds.has(imageId));

      if (!orderIsValid) {
        setWardrobeImageError(
          "The image order must include every image exactly once."
        );
        return null;
      }

      setWardrobeImageLoading(true);
      setWardrobeImageError("");

      try {
        const rows = uniqueIds.map((imageId, index) => {
          const image = item.images.find((entry) => entry.id === imageId);

          return {
            id: image.id,
            user_id: user.id,
            wardrobe_item_id: itemId,
            image_path: image.image_path,
            processed_image_path: image.processed_image_path || null,
            display_order: index,
            is_primary: Boolean(image.is_primary),
          };
        });

        const { error } = await supabase
          .from("wardrobe_item_images")
          .upsert(rows, { onConflict: "id" });

        if (error) {
          throw error;
        }

        return await refreshSingleWardrobeItem(itemId, false);
      } catch (error) {
        console.error("Could not reorder wardrobe images:", error);
        setWardrobeImageError(
          error.message || "Could not reorder wardrobe images."
        );
        return null;
      } finally {
        setWardrobeImageLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const replaceWardrobeImage = useCallback(
    async (itemId, imageId, file) => {
      if (!user?.id || !itemId || !imageId || !file) {
        return null;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );
      const existingImage = item?.images.find((image) => image.id === imageId);

      if (!item || !existingImage) {
        setWardrobeImageError("Could not find that wardrobe image.");
        return null;
      }

      setWardrobeImageLoading(true);
      setWardrobeImageError("");

      let newImagePath = null;
      let imageRowUpdated = false;

      try {
        newImagePath = await uploadWardrobeImage({
          file,
          userId: user.id,
          itemId,
        });

        const { error } = await supabase
          .from("wardrobe_item_images")
          .update({
            image_path: newImagePath,
            processed_image_path: null,
          })
          .eq("id", imageId)
          .eq("wardrobe_item_id", itemId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        imageRowUpdated = true;

        if (existingImage.is_primary) {
          const { error: itemError } = await supabase
            .from("wardrobe_items")
            .update({ image_path: newImagePath })
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (itemError) {
            throw itemError;
          }
        }

        const oldPaths = [
          existingImage.image_path,
          existingImage.processed_image_path,
        ].filter((path) => path && path !== newImagePath);

        clearSignedImageCache(oldPaths);

        try {
          await deleteWardrobeImagePaths(oldPaths);
        } catch (cleanupError) {
          console.error(
            "Image replaced, but old storage cleanup failed:",
            cleanupError
          );
          setWardrobeImageError(
            "The replacement was saved, but the old private image file could not be removed."
          );
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Could not replace wardrobe image:", error);

        if (imageRowUpdated) {
          try {
            await supabase
              .from("wardrobe_item_images")
              .update({
                image_path: existingImage.image_path,
                processed_image_path:
                  existingImage.processed_image_path || null,
              })
              .eq("id", imageId)
              .eq("user_id", user.id);

            if (existingImage.is_primary) {
              await supabase
                .from("wardrobe_items")
                .update({ image_path: existingImage.image_path })
                .eq("id", itemId)
                .eq("user_id", user.id);
            }
          } catch (rollbackError) {
            console.error(
              "Could not restore the previous wardrobe image:",
              rollbackError
            );
          }
        }

        if (newImagePath) {
          clearSignedImageCache([newImagePath]);

          try {
            await deleteWardrobeImagePaths([newImagePath]);
          } catch (cleanupError) {
            console.error(
              "Could not clean up failed replacement image:",
              cleanupError
            );
          }
        }

        setWardrobeImageError(
          error.message || "Could not replace the wardrobe image."
        );
        return null;
      } finally {
        setWardrobeImageLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const deleteWardrobeImage = useCallback(
    async (itemId, imageId) => {
      if (!user?.id || !itemId || !imageId) {
        return null;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );
      const imageToDelete = item?.images.find((image) => image.id === imageId);

      if (!item || !imageToDelete) {
        setWardrobeImageError("Could not find that wardrobe image.");
        return null;
      }

      setWardrobeImageLoading(true);
      setWardrobeImageError("");

      const remainingImages = item.images.filter((image) => image.id !== imageId);
      const replacementPrimary = imageToDelete.is_primary
        ? sortWardrobeImages(remainingImages)[0] || null
        : item.primary_image;

      let rowDeleted = false;
      let replacementPromoted = false;

      try {
        const { error: deleteError } = await supabase
          .from("wardrobe_item_images")
          .delete()
          .eq("id", imageId)
          .eq("wardrobe_item_id", itemId)
          .eq("user_id", user.id);

        if (deleteError) {
          throw deleteError;
        }

        rowDeleted = true;

        if (imageToDelete.is_primary && replacementPrimary?.id) {
          const { error: primaryError } = await supabase
            .from("wardrobe_item_images")
            .update({ is_primary: true })
            .eq("id", replacementPrimary.id)
            .eq("wardrobe_item_id", itemId)
            .eq("user_id", user.id);

          if (primaryError) {
            throw primaryError;
          }

          replacementPromoted = true;
        }

        if (imageToDelete.is_primary) {
          const { error: itemError } = await supabase
            .from("wardrobe_items")
            .update({
              image_path: replacementPrimary?.image_path || null,
            })
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (itemError) {
            throw itemError;
          }
        }

        const storagePaths = [
          imageToDelete.image_path,
          imageToDelete.processed_image_path,
        ].filter(Boolean);

        clearSignedImageCache(storagePaths);

        try {
          await deleteWardrobeImagePaths(storagePaths);
        } catch (cleanupError) {
          console.error(
            "Image row deleted, but storage cleanup failed:",
            cleanupError
          );
          setWardrobeImageError(
            "The image was removed from the item, but its private file could not be deleted."
          );
        }

        return await refreshSingleWardrobeItem(itemId, true);
      } catch (error) {
        console.error("Could not delete wardrobe image:", error);

        if (rowDeleted) {
          try {
            if (replacementPromoted && replacementPrimary?.id) {
              await supabase
                .from("wardrobe_item_images")
                .update({ is_primary: false })
                .eq("id", replacementPrimary.id)
                .eq("user_id", user.id);
            }

            await supabase.from("wardrobe_item_images").insert({
              id: imageToDelete.id,
              user_id: imageToDelete.user_id,
              wardrobe_item_id: imageToDelete.wardrobe_item_id,
              image_path: imageToDelete.image_path,
              processed_image_path:
                imageToDelete.processed_image_path || null,
              display_order: imageToDelete.display_order,
              is_primary: Boolean(imageToDelete.is_primary),
              created_at: imageToDelete.created_at,
            });

            if (imageToDelete.is_primary) {
              await supabase
                .from("wardrobe_items")
                .update({ image_path: imageToDelete.image_path })
                .eq("id", itemId)
                .eq("user_id", user.id);
            }
          } catch (rollbackError) {
            console.error(
              "Could not restore the deleted wardrobe image row:",
              rollbackError
            );
          }
        }

        setWardrobeImageError(
          error.message || "Could not delete the wardrobe image."
        );
        return null;
      } finally {
        setWardrobeImageLoading(false);
      }
    },
    [user, wardrobeItems, refreshSingleWardrobeItem]
  );

  const adjustPreferenceScore = useCallback(
    async (itemId, amount) => {
      if (!user?.id || !itemId || amount === 0) {
        return false;
      }

      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );

      if (!item) {
        return false;
      }

      const previousScore = normalizeNumber(item.preference_score, 0);
      const nextScore = previousScore + amount;

      commitItems((current) =>
        current.map((wardrobeItem) =>
          wardrobeItem.id === itemId
            ? {
                ...wardrobeItem,
                preference_score: nextScore,
              }
            : wardrobeItem
        )
      );

      try {
        const { error } = await supabase
          .from("wardrobe_items")
          .update({ preference_score: nextScore })
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        return true;
      } catch (error) {
        console.error("Could not update wardrobe preference score:", error);

        commitItems((current) =>
          current.map((wardrobeItem) =>
            wardrobeItem.id === itemId
              ? {
                  ...wardrobeItem,
                  preference_score: previousScore,
                }
              : wardrobeItem
          )
        );

        setWardrobeError(
          error.message || "Could not update the wardrobe preference score."
        );

        return false;
      }
    },
    [user, wardrobeItems, commitItems]
  );

  const toggleWardrobeFavorite = useCallback(
    async (itemId) => {
      const item = wardrobeItems.find(
        (wardrobeItem) => wardrobeItem.id === itemId
      );

      if (!item) {
        return null;
      }

      return updateWardrobeItem(itemId, {
        favorite: !item.favorite,
      });
    },
    [wardrobeItems, updateWardrobeItem]
  );

  const setWardrobeArchived = useCallback(
    async (itemId, archived) =>
      updateWardrobeItem(itemId, {
        archived: Boolean(archived),
      }),
    [updateWardrobeItem]
  );

  useEffect(() => {
    activeUserIdRef.current = user?.id || null;

    if (authLoading) {
      return;
    }

    if (!user?.id) {
      imageRefreshPromiseRef.current = null;
      lastFullImageRefreshAtRef.current = 0;
      setWardrobeItems([]);
      setWardrobeLoading(false);
      setWardrobeRefreshing(false);
      setWardrobeError("");
      setWardrobeImageLoading(false);
      setWardrobeImageError("");
      return;
    }

    const cached = readCache(user.id);

    const initialize = async () => {
      setWardrobeLoading(true);

      if (cached?.items?.length) {
        const hydrated = await hydrateImages(cached.items);

        if (activeUserIdRef.current === user.id) {
          commitItems(hydrated);
        }
      }

      await fetchWardrobeItems({
        silent: Boolean(cached),
      });
    };

    initialize();
  }, [authLoading, user?.id, fetchWardrobeItems, commitItems]);

  useEffect(() => {
    if (!user?.id || wardrobeItems.length === 0) {
      return undefined;
    }

    const refreshIfStale = () => {
      const lastRefresh = lastFullImageRefreshAtRef.current;
      const imagesAreStale =
        !lastRefresh ||
        Date.now() - lastRefresh >= SIGNED_URL_REFRESH_INTERVAL_MS;

      if (imagesAreStale) {
        void refreshWardrobeImages();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfStale();
      }
    };

    const intervalId = window.setInterval(
      refreshIfStale,
      SIGNED_URL_STALE_CHECK_INTERVAL_MS
    );

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [user?.id, wardrobeItems.length, refreshWardrobeImages]);

  const activeWardrobeItems = useMemo(
    () => wardrobeItems.filter((item) => !item.archived),
    [wardrobeItems]
  );

  const activeJacketItems = useMemo(
    () => activeWardrobeItems.filter((item) => item.category === "jacket"),
    [activeWardrobeItems]
  );

  const value = useMemo(
    () => ({
      wardrobeItems,
      activeWardrobeItems,
      activeJacketItems,

      wardrobeLoading,
      wardrobeRefreshing,
      wardrobeError,

      fetchWardrobeItems,
      refreshWardrobeImages,

      saveWardrobeItem,
      updateWardrobeItem,
      deleteWardrobeItem,

      adjustPreferenceScore,
      toggleWardrobeFavorite,
      setWardrobeArchived,

      maxWardrobeImagesPerItem: MAX_WARDROBE_IMAGES_PER_ITEM,
      wardrobeImageLoading,
      wardrobeImageError,
      clearWardrobeImageError,
      getWardrobeItemImages,
      addWardrobeImages,
      setPrimaryWardrobeImage,
      reorderWardrobeImages,
      replaceWardrobeImage,
      deleteWardrobeImage,
    }),
    [
      wardrobeItems,
      activeWardrobeItems,
      activeJacketItems,
      wardrobeLoading,
      wardrobeRefreshing,
      wardrobeError,
      fetchWardrobeItems,
      refreshWardrobeImages,
      saveWardrobeItem,
      updateWardrobeItem,
      deleteWardrobeItem,
      adjustPreferenceScore,
      toggleWardrobeFavorite,
      setWardrobeArchived,
      wardrobeImageLoading,
      wardrobeImageError,
      clearWardrobeImageError,
      getWardrobeItemImages,
      addWardrobeImages,
      setPrimaryWardrobeImage,
      reorderWardrobeImages,
      replaceWardrobeImage,
      deleteWardrobeImage,
    ]
  );

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
}
