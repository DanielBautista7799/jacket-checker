import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
createClosetImageUrl,
deleteClosetImage,
uploadClosetImage,
} from "../utils/uploadClosetImage";

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
    const signedUrl = await createClosetImageUrl(item.image_path);

    return {
        ...item,
        image_url: signedUrl,
    };
    } catch (error) {
    console.error("Could not create closet image URL:", error);

    return {
        ...item,
        image_url: null,
    };
    }
})
);
}

function useClosetItems(user) {
const [closetItems, setClosetItems] = useState([]);
const [closetLoading, setClosetLoading] = useState(false);
const [closetError, setClosetError] = useState("");

const fetchClosetItems = useCallback(async () => {
if (!user) {
    setClosetItems([]);
    return [];
}

setClosetLoading(true);
setClosetError("");

try {
    const { data, error } = await supabase
    .from("closet_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

    if (error) throw error;

    const hydratedItems = await hydrateClosetImages(data || []);

    setClosetItems(hydratedItems);
    return hydratedItems;
} catch (error) {
    console.error("Closet fetch failed:", error);
    setClosetError(error.message || "Could not fetch closet items.");
    return [];
} finally {
    setClosetLoading(false);
}
}, [user]);

const saveClosetItem = async (itemData, imageFile = null) => {
if (!user) {
    setClosetError("You must be signed in to save closet items.");
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
    };

    const { data, error } = await supabase
    .from("closet_items")
    .insert(payload)
    .select()
    .single();

    if (error) throw error;

    const signedUrl = data.image_path
    ? await createClosetImageUrl(data.image_path)
    : null;

    const hydratedItem = {
    ...data,
    image_url: signedUrl,
    };

    setClosetItems((current) => [hydratedItem, ...current]);

    return hydratedItem;
} catch (error) {
    console.error("Closet save failed:", error);

    if (uploadedImagePath) {
    try {
        await deleteClosetImage(uploadedImagePath);
    } catch (cleanupError) {
        console.error("Failed to clean up uploaded image:", cleanupError);
    }
    }

    setClosetError(error.message || "Could not save closet item.");
    return null;
} finally {
    setClosetLoading(false);
}
};

const deleteClosetItem = async (itemId) => {
if (!user) return false;

const itemToDelete = closetItems.find((item) => item.id === itemId);

if (!itemToDelete) return false;

setClosetLoading(true);
setClosetError("");

try {
    const { error } = await supabase
    .from("closet_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

    if (error) throw error;

    if (itemToDelete.image_path) {
    try {
        await deleteClosetImage(itemToDelete.image_path);
    } catch (imageError) {
        console.error("Closet record deleted, but image cleanup failed:", imageError);
    }
    }

    setClosetItems((current) =>
    current.filter((item) => item.id !== itemId)
    );

    return true;
} catch (error) {
    console.error("Closet delete failed:", error);
    setClosetError(error.message || "Could not delete closet item.");
    return false;
} finally {
    setClosetLoading(false);
}
};

const incrementTimesRecommended = async (itemId) => {
if (!user || !itemId) return;

const item = closetItems.find(
    (closetItem) => closetItem.id === itemId
);

if (!item) return;

const nextCount = (item.times_recommended || 0) + 1;

const { error } = await supabase
    .from("closet_items")
    .update({
    times_recommended: nextCount,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

if (error) {
    console.error("Could not increment recommendation count:", error);
    return;
}

setClosetItems((current) =>
    current.map((closetItem) =>
    closetItem.id === itemId
        ? {
            ...closetItem,
            times_recommended: nextCount,
        }
        : closetItem
    )
);
};

useEffect(() => {
fetchClosetItems();
}, [fetchClosetItems]);

return {
closetItems,
closetLoading,
closetError,
fetchClosetItems,
saveClosetItem,
deleteClosetItem,
incrementTimesRecommended,
};
}

export default useClosetItems;