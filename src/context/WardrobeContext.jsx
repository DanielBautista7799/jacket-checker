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
    
    export const WardrobeContext = createContext(null);
    
    const CACHE_VERSION = 1;
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const SIGNED_URL_TTL_MS = 45 * 60 * 1000;
    
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
    
    function normalizeWardrobeItem(item) {
    const preferenceScore = normalizeNumber(
        item?.preference_score,
        0
    );
    
    const recommendationCount = normalizeNumber(
        item?.recommendation_count ?? item?.times_recommended,
        0
    );
    
    const subtype = item?.subtype || item?.type || "other";
    
    const primaryColor =
        item?.primary_color || item?.color || "other";
    
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
    
        type: subtype,
        color: primaryColor,
        times_recommended: preferenceScore,
    
        ai_original_result:
        item?.original_ai_json ??
        item?.ai_original_result ??
        null,
    
        image_url: item?.image_url || null,
    };
    }
    
    function buildWardrobePayload(itemData, existingItem = null) {
    const source = itemData || {};
    const existing = existingItem || {};
    
    const aiGenerated = Boolean(
        source.ai_generated ??
        existing.ai_generated ??
        false
    );
    
    const secondaryColor =
        source.secondary_color ??
        existing.secondary_color ??
        null;
    
    const recommendationCount = normalizeNumber(
        source.recommendation_count ??
        existing.recommendation_count,
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
        name: String(
        source.name ??
            existing.name ??
            ""
        ).trim(),
    
        category:
        source.category ??
        existing.category ??
        "jacket",
    
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
        typeof secondaryColor === "string" &&
        secondaryColor.trim()
            ? secondaryColor.trim()
            : null,
    
        materials: normalizeArray(
        source.materials ??
            existing.materials
        ),
    
        warmth_rating: normalizeNumber(
        source.warmth_rating ??
            existing.warmth_rating,
        1
        ),
    
        rain_rating: normalizeNumber(
        source.rain_rating ??
            existing.rain_rating,
        1
        ),
    
        wind_rating: normalizeNumber(
        source.wind_rating ??
            existing.wind_rating,
        1
        ),
    
        formality_rating: normalizeNumber(
        source.formality_rating ??
            existing.formality_rating,
        1
        ),
    
        fit:
        source.fit ??
        existing.fit ??
        "regular",
    
        style_tags: normalizeArray(
        source.style_tags ??
            existing.style_tags
        ),
    
        weather_use: normalizeArray(
        source.weather_use ??
            existing.weather_use
        ),
    
        description:
        source.description !== undefined
            ? source.description
            : existing.description ?? null,
    
        favorite: Boolean(
        source.favorite ??
            existing.favorite ??
            false
        ),
    
        archived: Boolean(
        source.archived ??
            existing.archived ??
            false
        ),
    
        times_recommended: recommendationCount,
        preference_score: preferenceScore,
        ai_generated: aiGenerated,
    
        ai_provider:
        source.ai_provider ??
        existing.ai_provider ??
        (aiGenerated ? "gemini" : null),
    
        ai_model:
        source.ai_model ??
        existing.ai_model ??
        null,
    
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
    
        confirmed_by_user:
        source.confirmed_by_user ?? true,
    };
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
            ? parsed.items.map(normalizeWardrobeItem)
            : [],
    
        savedAt:
            Number(parsed.savedAt) || 0,
        };
    } catch (error) {
        console.error(
        "Could not read wardrobe cache:",
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
        "Could not write wardrobe cache:",
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
    
    const cached =
        signedImageCache.get(imagePath);
    
    if (
        !force &&
        cached &&
        Date.now() - cached.savedAt <
        SIGNED_URL_TTL_MS
    ) {
        return cached.url;
    }
    
    const url =
        await createClosetImageUrl(imagePath);
    
    signedImageCache.set(imagePath, {
        url,
        savedAt: Date.now(),
    });
    
    return url;
    }
    
    async function hydrateImages(
    items,
    force = false
    ) {
    return Promise.all(
        items.map(async (rawItem) => {
        const item =
            normalizeWardrobeItem(rawItem);
    
        if (!item.image_path) {
            return {
            ...item,
            image_url: null,
            };
        }
    
        try {
            return {
            ...item,
    
            image_url:
                await getSignedImageUrl(
                item.image_path,
                force
                ),
            };
        } catch (error) {
            console.error(
            "Could not create wardrobe image URL:",
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
    
    async function requestWardrobe(userId) {
    if (
        inFlightWardrobeRequests.has(userId)
    ) {
        return inFlightWardrobeRequests.get(
        userId
        );
    }
    
    const request = supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
        ascending: false,
        })
        .then(({ data, error }) => {
        if (error) {
            throw error;
        }
    
        return (data || []).map(
            normalizeWardrobeItem
        );
        })
        .finally(() => {
        inFlightWardrobeRequests.delete(
            userId
        );
        });
    
    inFlightWardrobeRequests.set(
        userId,
        request
    );
    
    return request;
    }
    
    export function WardrobeProvider({
    children,
    }) {
    const { user, authLoading } =
        useAuth();
    
    const [
        wardrobeItems,
        setWardrobeItems,
    ] = useState([]);
    
    const [
        wardrobeLoading,
        setWardrobeLoading,
    ] = useState(Boolean(user));
    
    const [
        wardrobeRefreshing,
        setWardrobeRefreshing,
    ] = useState(false);
    
    const [
        wardrobeError,
        setWardrobeError,
    ] = useState("");
    
    const activeUserIdRef = useRef(
        user?.id || null
    );
    
    const commitItems = useCallback(
        (updater) => {
        setWardrobeItems((current) => {
            const nextValue =
            typeof updater === "function"
                ? updater(current)
                : updater;
    
            const next = nextValue.map(
            normalizeWardrobeItem
            );
    
            if (activeUserIdRef.current) {
            writeCache(
                activeUserIdRef.current,
                next
            );
            }
    
            return next;
        });
        },
        []
    );
    
    const fetchWardrobeItems =
        useCallback(
        async ({
            force = false,
            silent = false,
        } = {}) => {
            if (!user?.id) {
            setWardrobeItems([]);
            setWardrobeLoading(false);
            setWardrobeRefreshing(false);
    
            return [];
            }
    
            const cached =
            readCache(user.id);
    
            const cacheIsFresh =
            cached &&
            Date.now() - cached.savedAt <
                CACHE_TTL_MS;
    
            if (
            !force &&
            cacheIsFresh
            ) {
            setWardrobeLoading(true);
    
            const hydrated =
                await hydrateImages(
                cached.items
                );
    
            if (
                activeUserIdRef.current ===
                user.id
            ) {
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
            const rows =
                await requestWardrobe(
                user.id
                );
    
            const hydrated =
                await hydrateImages(
                rows,
                force
                );
    
            if (
                activeUserIdRef.current !==
                user.id
            ) {
                return [];
            }
    
            commitItems(hydrated);
    
            return hydrated;
            } catch (error) {
            console.error(
                "Wardrobe fetch failed:",
                error
            );
    
            if (
                activeUserIdRef.current ===
                user.id
            ) {
                setWardrobeError(
                error.message ||
                    "Could not fetch wardrobe items."
                );
            }
    
            return cached?.items || [];
            } finally {
            if (
                activeUserIdRef.current ===
                user.id
            ) {
                setWardrobeLoading(false);
                setWardrobeRefreshing(false);
            }
            }
        },
        [user, commitItems]
        );
    
    const refreshWardrobeImages =
        useCallback(async () => {
        if (!user?.id) {
            return [];
        }
    
        setWardrobeRefreshing(true);
    
        try {
            const hydrated =
            await hydrateImages(
                wardrobeItems,
                true
            );
    
            commitItems(hydrated);
    
            return hydrated;
        } catch (error) {
            console.error(
            "Could not refresh wardrobe images:",
            error
            );
    
            return wardrobeItems;
        } finally {
            setWardrobeRefreshing(false);
        }
        }, [
        user?.id,
        wardrobeItems,
        commitItems,
        ]);
    
    const saveWardrobeItem =
        useCallback(
        async (
            itemData,
            imageFile = null
        ) => {
            if (!user?.id) {
            setWardrobeError(
                "You must be signed in to save wardrobe items."
            );
    
            return null;
            }
    
            setWardrobeLoading(true);
            setWardrobeError("");
    
            let uploadedImagePath = null;
    
            try {
            if (imageFile) {
                uploadedImagePath =
                await uploadClosetImage({
                    file: imageFile,
                    userId: user.id,
                });
            }
    
            const payload = {
                user_id: user.id,
    
                ...buildWardrobePayload(
                itemData
                ),
    
                image_path:
                uploadedImagePath ||
                itemData?.image_path ||
                null,
            };
    
            const { data, error } =
                await supabase
                .from("wardrobe_items")
                .insert(payload)
                .select()
                .single();
    
            if (error) {
                throw error;
            }
    
            const hydratedItem = (
                await hydrateImages(
                [
                    normalizeWardrobeItem(
                    data
                    ),
                ],
                true
                )
            )[0];
    
            commitItems((current) => [
                hydratedItem,
                ...current,
            ]);
    
            return hydratedItem;
            } catch (error) {
            console.error(
                "Wardrobe save failed:",
                error
            );
    
            if (uploadedImagePath) {
                try {
                await deleteClosetImage(
                    uploadedImagePath
                );
                } catch (cleanupError) {
                console.error(
                    "Failed to clean up uploaded wardrobe image:",
                    cleanupError
                );
                }
            }
    
            setWardrobeError(
                error.message ||
                "Could not save wardrobe item."
            );
    
            return null;
            } finally {
            setWardrobeLoading(false);
            }
        },
        [user, commitItems]
        );
    
    const updateWardrobeItem =
        useCallback(
        async (
            itemId,
            itemData,
            replacementImageFile = null
        ) => {
            if (!user?.id || !itemId) {
            return null;
            }
    
            const existingItem =
            wardrobeItems.find(
                (item) =>
                item.id === itemId
            );
    
            if (!existingItem) {
            setWardrobeError(
                "Could not find the wardrobe item to update."
            );
    
            return null;
            }
    
            setWardrobeLoading(true);
            setWardrobeError("");
    
            let newImagePath = null;
    
            try {
            if (replacementImageFile) {
                newImagePath =
                await uploadClosetImage({
                    file:
                    replacementImageFile,
    
                    userId: user.id,
                });
            }
    
            const payload = {
                ...buildWardrobePayload(
                itemData,
                existingItem
                ),
    
                image_path:
                newImagePath ||
                existingItem.image_path ||
                null,
            };
    
            const { data, error } =
                await supabase
                .from("wardrobe_items")
                .update(payload)
                .eq("id", itemId)
                .eq(
                    "user_id",
                    user.id
                )
                .select()
                .single();
    
            if (error) {
                throw error;
            }
    
            if (
                newImagePath &&
                existingItem.image_path &&
                existingItem.image_path !==
                newImagePath
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
                    "Wardrobe item updated, but old image cleanup failed:",
                    cleanupError
                );
                }
            }
    
            const hydratedItem = (
                await hydrateImages(
                [
                    normalizeWardrobeItem(
                    data
                    ),
                ],
                true
                )
            )[0];
    
            commitItems((current) =>
                current.map((item) =>
                item.id === itemId
                    ? hydratedItem
                    : item
                )
            );
    
            return hydratedItem;
            } catch (error) {
            console.error(
                "Wardrobe update failed:",
                error
            );
    
            if (newImagePath) {
                signedImageCache.delete(
                newImagePath
                );
    
                try {
                await deleteClosetImage(
                    newImagePath
                );
                } catch (cleanupError) {
                console.error(
                    "Could not clean up replacement wardrobe image:",
                    cleanupError
                );
                }
            }
    
            setWardrobeError(
                error.message ||
                "Could not update wardrobe item."
            );
    
            return null;
            } finally {
            setWardrobeLoading(false);
            }
        },
        [
            user,
            wardrobeItems,
            commitItems,
        ]
        );
    
    const deleteWardrobeItem =
        useCallback(
        async (itemId) => {
            if (!user?.id) {
            return false;
            }
    
            const itemToDelete =
            wardrobeItems.find(
                (item) =>
                item.id === itemId
            );
    
            if (!itemToDelete) {
            return false;
            }
    
            setWardrobeLoading(true);
            setWardrobeError("");
    
            try {
            const { error } =
                await supabase
                .from("wardrobe_items")
                .delete()
                .eq("id", itemId)
                .eq(
                    "user_id",
                    user.id
                );
    
            if (error) {
                throw error;
            }
    
            commitItems((current) =>
                current.filter(
                (item) =>
                    item.id !== itemId
                )
            );
    
            if (
                itemToDelete.image_path
            ) {
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
            console.error(
                "Wardrobe delete failed:",
                error
            );
    
            setWardrobeError(
                error.message ||
                "Could not delete wardrobe item."
            );
    
            return false;
            } finally {
            setWardrobeLoading(false);
            }
        },
        [
            user,
            wardrobeItems,
            commitItems,
        ]
        );
    
    const adjustPreferenceScore =
        useCallback(
        async (itemId, amount) => {
            if (
            !user?.id ||
            !itemId ||
            amount === 0
            ) {
            return false;
            }
    
            const item =
            wardrobeItems.find(
                (wardrobeItem) =>
                wardrobeItem.id ===
                itemId
            );
    
            if (!item) {
            return false;
            }
    
            const previousScore =
            normalizeNumber(
                item.preference_score,
                0
            );
    
            const nextScore =
            previousScore + amount;
    
            commitItems((current) =>
            current.map(
                (wardrobeItem) =>
                wardrobeItem.id ===
                itemId
                    ? {
                        ...wardrobeItem,
                        preference_score:
                        nextScore,
                    }
                    : wardrobeItem
            )
            );
    
            try {
            const { error } =
                await supabase
                .from("wardrobe_items")
                .update({
                    preference_score:
                    nextScore,
                })
                .eq("id", itemId)
                .eq(
                    "user_id",
                    user.id
                );
    
            if (error) {
                throw error;
            }
    
            return true;
            } catch (error) {
            console.error(
                "Could not update wardrobe preference score:",
                error
            );
    
            commitItems((current) =>
                current.map(
                (wardrobeItem) =>
                    wardrobeItem.id ===
                    itemId
                    ? {
                        ...wardrobeItem,
                        preference_score:
                            previousScore,
                        }
                    : wardrobeItem
                )
            );
    
            setWardrobeError(
                error.message ||
                "Could not update the wardrobe preference score."
            );
    
            return false;
            }
        },
        [
            user,
            wardrobeItems,
            commitItems,
        ]
        );
    
    const toggleWardrobeFavorite =
        useCallback(
        async (itemId) => {
            const item =
            wardrobeItems.find(
                (wardrobeItem) =>
                wardrobeItem.id ===
                itemId
            );
    
            if (!item) {
            return null;
            }
    
            return updateWardrobeItem(
            itemId,
            {
                favorite:
                !item.favorite,
            }
            );
        },
        [
            wardrobeItems,
            updateWardrobeItem,
        ]
        );
    
    const setWardrobeArchived =
        useCallback(
        async (
            itemId,
            archived
        ) =>
            updateWardrobeItem(
            itemId,
            {
                archived:
                Boolean(archived),
            }
            ),
        [updateWardrobeItem]
        );
    
    useEffect(() => {
        activeUserIdRef.current =
        user?.id || null;
    
        if (authLoading) {
        return;
        }
    
        if (!user?.id) {
        setWardrobeItems([]);
        setWardrobeLoading(false);
        setWardrobeRefreshing(false);
        setWardrobeError("");
    
        return;
        }
    
        const cached =
        readCache(user.id);
    
        const initialize = async () => {
        setWardrobeLoading(true);
    
        if (
            cached?.items?.length
        ) {
            const hydrated =
            await hydrateImages(
                cached.items
            );
    
            if (
            activeUserIdRef.current ===
            user.id
            ) {
            commitItems(hydrated);
            }
        }
    
        await fetchWardrobeItems({
            silent: Boolean(cached),
        });
        };
    
        initialize();
    }, [
        authLoading,
        user?.id,
        fetchWardrobeItems,
        commitItems,
    ]);
    
    const activeWardrobeItems =
        useMemo(
        () =>
            wardrobeItems.filter(
            (item) =>
                !item.archived
            ),
        [wardrobeItems]
        );
    
    const activeJacketItems =
        useMemo(
        () =>
            activeWardrobeItems.filter(
            (item) =>
                item.category ===
                "jacket"
            ),
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
        ]
    );
    
    return (
        <WardrobeContext.Provider
        value={value}
        >
        {children}
        </WardrobeContext.Provider>
    );
    }