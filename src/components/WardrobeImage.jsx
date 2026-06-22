import { Shirt } from "lucide-react";
import { useState } from "react";

import useWardrobeImages from "../hooks/useWardrobeImages";
import {
  resolveWardrobeImage,
  resolveWardrobeImageKey,
} from "../utils/resolveWardrobeImage";

function WardrobeImage({
  item,
  alt,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-white/10 text-slate-500",
  iconSize = 24,
  loading = "lazy",
  showLabel = false,
}) {
  const { refreshWardrobeImages } = useWardrobeImages();
  const resolvedImage = resolveWardrobeImage(item);
  const imageUrl = resolvedImage?.url || null;
  const imageKey = resolveWardrobeImageKey(item);

  const [failedUrl, setFailedUrl] = useState(null);
  const [refreshAttemptedKey, setRefreshAttemptedKey] = useState(null);

  const imageFailed = Boolean(imageUrl && failedUrl === imageUrl);

  const handleImageError = () => {
    setFailedUrl(imageUrl);

    if (imageKey && refreshAttemptedKey !== imageKey) {
      setRefreshAttemptedKey(imageKey);
      void refreshWardrobeImages();
    }
  };

  if (!imageUrl || imageFailed) {
    return (
      <div
        className={fallbackClassName}
        aria-label={alt || "No image available"}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Shirt size={iconSize} aria-hidden="true" />

          {showLabel && (
            <span className="px-3 text-xs font-semibold text-slate-500">
              No photo available
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || item?.name || "Wardrobe item"}
      className={className}
      loading={loading}
      onLoad={() => setFailedUrl(null)}
      onError={handleImageError}
    />
  );
}

export default WardrobeImage;
