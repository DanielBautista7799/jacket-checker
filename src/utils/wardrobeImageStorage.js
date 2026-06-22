import { supabase } from "../lib/supabaseClient";

export const WARDROBE_IMAGE_BUCKET = "closet-images";
export const MAX_WARDROBE_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_WARDROBE_IMAGES_PER_ITEM = 8;

const ALLOWED_WARDROBE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getImageExtension(file) {
  const extensionFromName = file?.name
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (
    extensionFromName &&
    ["jpg", "jpeg", "png", "webp"].includes(extensionFromName)
  ) {
    return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
  }

  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensionByType[file?.type] || "jpg";
}

function normalizeFileList(files) {
  if (!files) {
    return [];
  }

  if (Array.isArray(files)) {
    return files.filter(Boolean);
  }

  return Array.from(files).filter(Boolean);
}

function normalizePathPart(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");

  return normalized || fallback;
}

export function validateWardrobeImage(file) {
  if (!file) {
    return {
      valid: false,
      error: "Select an image first.",
    };
  }

  if (!ALLOWED_WARDROBE_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Use a JPG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_WARDROBE_IMAGE_SIZE) {
    return {
      valid: false,
      error: "Each image must be smaller than 5 MB.",
    };
  }

  return {
    valid: true,
    error: "",
  };
}

export function validateWardrobeImages(
  files,
  {
    currentCount = 0,
    maxImages = MAX_WARDROBE_IMAGES_PER_ITEM,
  } = {}
) {
  const normalizedFiles = normalizeFileList(files);

  if (normalizedFiles.length === 0) {
    return {
      valid: false,
      error: "Select at least one image.",
      files: [],
    };
  }

  if (currentCount + normalizedFiles.length > maxImages) {
    return {
      valid: false,
      error: `Each wardrobe item can have up to ${maxImages} images.`,
      files: normalizedFiles,
    };
  }

  for (const file of normalizedFiles) {
    const validation = validateWardrobeImage(file);

    if (!validation.valid) {
      return {
        ...validation,
        files: normalizedFiles,
      };
    }
  }

  return {
    valid: true,
    error: "",
    files: normalizedFiles,
  };
}

export async function uploadWardrobeImage({
  file,
  userId,
  itemId,
}) {
  if (!userId) {
    throw new Error("You must be signed in to upload an image.");
  }

  const validation = validateWardrobeImage(file);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const safeUserId = normalizePathPart(userId, "user");
  const safeItemId = normalizePathPart(itemId, "unassigned");
  const extension = getImageExtension(file);
  const imagePath = `${safeUserId}/${safeItemId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(WARDROBE_IMAGE_BUCKET)
    .upload(imagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return imagePath;
}

export async function uploadWardrobeImages({
  files,
  userId,
  itemId,
  currentCount = 0,
  maxImages = MAX_WARDROBE_IMAGES_PER_ITEM,
}) {
  const validation = validateWardrobeImages(files, {
    currentCount,
    maxImages,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const uploadedPaths = [];

  try {
    for (const file of validation.files) {
      const imagePath = await uploadWardrobeImage({
        file,
        userId,
        itemId,
      });

      uploadedPaths.push(imagePath);
    }

    return uploadedPaths;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      try {
        await deleteWardrobeImagePaths(uploadedPaths);
      } catch (cleanupError) {
        console.error(
          "Could not clean up partially uploaded wardrobe images:",
          cleanupError
        );
      }
    }

    throw error;
  }
}

export async function deleteWardrobeImagePaths(paths) {
  const uniquePaths = [
    ...new Set(
      normalizeFileList(paths)
        .map((path) => String(path || "").trim())
        .filter(Boolean)
    ),
  ];

  if (uniquePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(WARDROBE_IMAGE_BUCKET)
    .remove(uniquePaths);

  if (error) {
    throw error;
  }
}

export async function createWardrobeImageUrl(
  imagePath,
  expiresInSeconds = 60 * 60
) {
  if (!imagePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(WARDROBE_IMAGE_BUCKET)
    .createSignedUrl(imagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
