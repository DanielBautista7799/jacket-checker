import {
  createWardrobeImageUrl,
  deleteWardrobeImagePaths,
  uploadWardrobeImage,
  validateWardrobeImage,
} from "./wardrobeImageStorage";

export function validateClosetImage(file) {
  if (!file) {
    return {
      valid: true,
      error: "",
    };
  }

  return validateWardrobeImage(file);
}

export async function uploadClosetImage({
  file,
  userId,
  itemId = "legacy",
}) {
  if (!file) {
    return null;
  }

  return uploadWardrobeImage({
    file,
    userId,
    itemId,
  });
}

export async function deleteClosetImage(imagePath) {
  if (!imagePath) {
    return;
  }

  await deleteWardrobeImagePaths([imagePath]);
}

export async function createClosetImageUrl(
  imagePath,
  expiresInSeconds = 60 * 60
) {
  return createWardrobeImageUrl(imagePath, expiresInSeconds);
}
