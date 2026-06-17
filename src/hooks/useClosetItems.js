import {
useCallback,
useEffect,
useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

import {
createClosetImageUrl,
deleteClosetImage,
uploadClosetImage,
} from "../utils/uploadClosetImage";

const closetMemoryCache = new Map();
const signedImageMemoryCache = new Map();

function getClosetCacheKey(userId) {
return `jacket-check:closet:${userId}`;
}

function readCachedCloset(userId) {
if (!userId) {
    return [];
}

if (closetMemoryCache.has(userId)) {
    return closetMemoryCache.get(userId);
}

try {
    const saved = localStorage.getItem(
    getClosetCacheKey(userId)
    );

    if (!saved) {
    return [];
    }

    const parsed = JSON.parse(saved);

    closetMemoryCache.set(userId, parsed);

    return parsed;
} catch (error) {
    console.error("Could not read closet cache:", error);
    return [];
}
}

function writeCachedCloset(userId, items) {
if (!userId) {
    return;
}

closetMemoryCache.set(userId, items);

const serializableItems = items.map((item) => ({
    ...item,
    image_url: null,
}));

try {
    localStorage.setItem(
    getClosetCacheKey(userId),
    JSON.stringify(serializableItems)
    );
} catch (error) {
    console.error("Could not write closet cache:", error);
}
}

async function getSignedImageUrl(imagePath) {
if (!imagePath) {
    return null;
}

if (signedImageMemoryCache.has(imagePath)) {
    return signedImageMemoryCache.get(imagePath);
}

const signedUrl =
    await createClosetImageUrl(imagePath);

signedImageMemoryCache.set(imagePath, signedUrl);

return signedUrl;
}

async function hydrateClosetImages(items) {
return Promise.all(
    items.map(async (item) => {
    if (!item.image_path) {
        return {
        ...item,
        image_url: null,
        };
    }

    try {
        const signedUrl = await getSignedImageUrl(
        item.image_path
        );

        return {
        ...item,
        image_url: signedUrl,
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

function useClosetItems(user) {
const cachedItems = readCachedCloset(user?.id);

const [closetItems, setClosetItems] =
    useState(cachedItems);

const [closetLoading, setClosetLoading] =
    useState(!cachedItems.length && Boolean(user));

const [closetRefreshing, setClosetRefreshing] =
    useState(false);

const [closetError, setClosetError] =
    useState("");

const updateLocalCloset = useCallback(
    (updater) => {
    setClosetItems((current) => {
        const nextItems =
        typeof updater === "function"
            ? updater(current)
            : updater;

        if (user?.id) {
        writeCachedCloset(
            user.id,
            nextItems
        );
        }

        return nextItems;
    });
    },
    [user?.id]
);

const fetchClosetItems = useCallback(
    async ({ silent = false } = {}) => {
    if (!user) {
        setClosetItems([]);
        setClosetLoading(false);
        return [];
    }

    const existingItems =
        readCachedCloset(user.id);

    if (silent || existingItems.length) {
        setClosetRefreshing(true);
    } else {
        setClosetLoading(true);
    }

    setClosetError("");

    try {
        const { data, error } = await supabase
        .from("closet_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false,
        });

        if (error) {
        throw error;
        }

        const hydratedItems =
        await hydrateClosetImages(data || []);

        updateLocalCloset(hydratedItems);

        return hydratedItems;
    } catch (error) {
        console.error(
        "Closet fetch failed:",
        error
        );

        setClosetError(
        error.message ||
            "Could not fetch closet items."
        );

        return existingItems;
    } finally {
        setClosetLoading(false);
        setClosetRefreshing(false);
    }
    },
    [user, updateLocalCloset]
);

const saveClosetItem = async (
    itemData,
    imageFile = null
) => {
    if (!user) {
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
        uploadedImagePath =
        await uploadClosetImage({
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
        Number(
            itemData.times_recommended
        ) || 0,
    };

    const { data, error } = await supabase
        .from("closet_items")
        .insert(payload)
        .select()
        .single();

    if (error) {
        throw error;
    }

    let signedUrl = null;

    if (data.image_path) {
        signedUrl = await getSignedImageUrl(
        data.image_path
        );
    }

    const hydratedItem = {
        ...data,
        image_url: signedUrl,
    };

    updateLocalCloset((current) => [
        hydratedItem,
        ...current,
    ]);

    return hydratedItem;
    } catch (error) {
    console.error(
        "Closet save failed:",
        error
    );

    if (uploadedImagePath) {
        try {
        await deleteClosetImage(
            uploadedImagePath
        );
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
};

const updateClosetItem = async (
    itemId,
    itemData,
    replacementImageFile = null
) => {
    if (!user || !itemId) {
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
        newImagePath =
        await uploadClosetImage({
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
        existingItem.image_path !==
        newImagePath
    ) {
        try {
        signedImageMemoryCache.delete(
            existingItem.image_path
        );

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

    let signedUrl =
        existingItem.image_url || null;

    if (data.image_path) {
        signedUrl = await getSignedImageUrl(
        data.image_path
        );
    }

    const hydratedItem = {
        ...data,
        image_url: signedUrl,
    };

    updateLocalCloset((current) =>
        current.map((item) =>
        item.id === itemId
            ? hydratedItem
            : item
        )
    );

    return hydratedItem;
    } catch (error) {
    console.error(
        "Closet update failed:",
        error
    );

    if (newImagePath) {
        try {
        signedImageMemoryCache.delete(
            newImagePath
        );

        await deleteClosetImage(
            newImagePath
        );
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
};

const deleteClosetItem = async (itemId) => {
    if (!user) {
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

    if (itemToDelete.image_path) {
        try {
        signedImageMemoryCache.delete(
            itemToDelete.image_path
        );

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

    updateLocalCloset((current) =>
        current.filter(
        (item) => item.id !== itemId
        )
    );

    return true;
    } catch (error) {
    console.error(
        "Closet delete failed:",
        error
    );

    setClosetError(
        error.message ||
        "Could not delete closet item."
    );

    return false;
    } finally {
    setClosetLoading(false);
    }
};

const adjustTimesRecommended = async (
    itemId,
    amount
) => {
    if (!user || !itemId || amount === 0) {
    return false;
    }

    const item = closetItems.find(
    (closetItem) =>
        closetItem.id === itemId
    );

    if (!item) {
    return false;
    }

    const previousScore = Number(
    item.times_recommended || 0
    );

    const nextScore =
    previousScore + amount;

    updateLocalCloset((current) =>
    current.map((closetItem) =>
        closetItem.id === itemId
        ? {
            ...closetItem,
            times_recommended:
                nextScore,
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

    updateLocalCloset((current) =>
        current.map((closetItem) =>
        closetItem.id === itemId
            ? {
                ...closetItem,
                times_recommended:
                previousScore,
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
};

useEffect(() => {
    if (!user) {
    setClosetItems([]);
    setClosetLoading(false);
    return;
    }

    const cached =
    readCachedCloset(user.id);

    if (cached.length) {
    setClosetItems(cached);
    setClosetLoading(false);

    hydrateClosetImages(cached).then(
        (hydrated) => {
        updateLocalCloset(hydrated);
        }
    );

    fetchClosetItems({
        silent: true,
    });
    } else {
    fetchClosetItems();
    }
}, [
    user,
    fetchClosetItems,
    updateLocalCloset,
]);

return {
    closetItems,
    closetLoading,
    closetRefreshing,
    closetError,
    fetchClosetItems,
    saveClosetItem,
    updateClosetItem,
    deleteClosetItem,
    adjustTimesRecommended,
};
}

export default useClosetItems;