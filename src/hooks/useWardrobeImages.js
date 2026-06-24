import { useCallback } from "react";
import useWardrobeItems from "./useWardrobeItems";
import useAnalytics from "./useAnalytics";

export default function useWardrobeImages() {
  const { track } = useAnalytics();
  const {
    maxWardrobeImagesPerItem,
    wardrobeImageLoading,
    wardrobeImageError,
    clearWardrobeImageError,
    getWardrobeItemImages,
    addWardrobeImages: addImages,
    setPrimaryWardrobeImage: setPrimaryImage,
    reorderWardrobeImages,
    replaceWardrobeImage,
    deleteWardrobeImage,
    refreshWardrobeImages: refreshImages,
  } = useWardrobeItems();

  const addWardrobeImages = useCallback(async (...args) => {
    const result = await addImages(...args);
    if (result) {
      const files = Array.isArray(args[1]) ? args[1] : [];
      track("jacket_image_added", { experienceMode: "personalized", metadata: { image_count: files.length || 1 } });
    }
    return result;
  }, [addImages, track]);

  const setPrimaryWardrobeImage = useCallback(async (...args) => {
    const result = await setPrimaryImage(...args);
    if (result) track("jacket_primary_image_changed", { experienceMode: "personalized", metadata: { primary_changed: true } });
    return result;
  }, [setPrimaryImage, track]);

  const refreshWardrobeImages = useCallback(async (...args) => {
    const result = await refreshImages(...args);
    if (result) track("signed_image_cache_refresh", { experienceMode: "personalized", metadata: { refreshed: true } });
    return result;
  }, [refreshImages, track]);

  return {
    maxWardrobeImagesPerItem,
    wardrobeImageLoading,
    wardrobeImageError,
    clearWardrobeImageError,
    getWardrobeItemImages,
    addWardrobeImages,
    setPrimaryWardrobeImage,
    reorderWardrobeImages,
    replaceWardrobeImage,
    deleteWardrobeImage,
    refreshWardrobeImages,
  };
}
