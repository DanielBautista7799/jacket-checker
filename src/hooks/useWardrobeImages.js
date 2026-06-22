import useWardrobeItems from "./useWardrobeItems";

function useWardrobeImages() {
  const {
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
  } = useWardrobeItems();

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

export default useWardrobeImages;
