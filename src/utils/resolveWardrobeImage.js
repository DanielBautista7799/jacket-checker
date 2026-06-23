function getOrderedImages(item) {
  if (!Array.isArray(item?.images)) {
    return [];
  }

  return [...item.images].sort((first, second) => {
    const firstOrder = Number(first?.display_order) || 0;
    const secondOrder = Number(second?.display_order) || 0;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    const createdDifference = String(first?.created_at || "").localeCompare(
      String(second?.created_at || "")
    );

    if (createdDifference !== 0) {
      return createdDifference;
    }

    return String(first?.id || "").localeCompare(String(second?.id || ""));
  });
}

function resolveOriginalImageCandidate(image) {
  if (!image || typeof image !== "object" || !image.image_url) {
    return null;
  }

  return {
    url: image.image_url,
    path: image.image_path || null,
    imageId: image.id || null,
    processed: false,
  };
}

export function resolveWardrobeImage(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const orderedImages = getOrderedImages(item);
  const markedPrimary = orderedImages.find((image) => image?.is_primary);
  const primaryImage = item.primary_image || markedPrimary || null;
  const firstImage = orderedImages[0] || null;

  const primaryCandidate = resolveOriginalImageCandidate(primaryImage);

  if (primaryCandidate) {
    return primaryCandidate;
  }

  const firstCandidate = resolveOriginalImageCandidate(firstImage);

  if (firstCandidate) {
    return firstCandidate;
  }

  if (item.image_url) {
    return {
      url: item.image_url,
      path: item.image_path || null,
      imageId: null,
      processed: false,
    };
  }

  return null;
}

export function resolveWardrobeImageUrl(item) {
  return resolveWardrobeImage(item)?.url || null;
}

export function resolveWardrobeImageKey(item) {
  const resolved = resolveWardrobeImage(item);

  if (!resolved) {
    return null;
  }

  return resolved.path || resolved.imageId || resolved.url;
}
