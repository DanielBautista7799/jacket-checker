import { UPLOAD_SECURITY_CONFIG } from "../config/uploadSecurityConfig";
import sanitizeUploadFilename from "./sanitizeUploadFilename";

function getExtension(filename = "") {
  return String(filename).split(".").pop()?.toLowerCase() || "";
}

function loadImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined" || typeof URL === "undefined") {
      resolve(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const result = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file could not be read as an image."));
    };
    image.src = objectUrl;
  });
}

export async function validateJacketImageFile(file, { checkDimensions = true } = {}) {
  if (!file) return { valid: false, error: "Select an image first." };
  if (!(file instanceof Blob)) return { valid: false, error: "The selected file is invalid." };
  if (file.size <= 0) return { valid: false, error: "The selected image is empty." };
  if (!UPLOAD_SECURITY_CONFIG.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: "Use a JPG, PNG, or WebP image." };
  }
  const extension = getExtension(file.name);
  if (extension && !UPLOAD_SECURITY_CONFIG.allowedExtensions.includes(extension)) {
    return { valid: false, error: "The file extension does not match a supported image format." };
  }
  if (file.size > UPLOAD_SECURITY_CONFIG.maxBytes) {
    return { valid: false, error: "Each image must be smaller than 5 MB." };
  }

  let dimensions = null;
  if (checkDimensions) {
    try {
      dimensions = await loadImageDimensions(file);
      if (dimensions) {
        const { width, height } = dimensions;
        if (width < UPLOAD_SECURITY_CONFIG.minWidth || height < UPLOAD_SECURITY_CONFIG.minHeight) {
          return { valid: false, error: `Use an image at least ${UPLOAD_SECURITY_CONFIG.minWidth} × ${UPLOAD_SECURITY_CONFIG.minHeight} pixels.` };
        }
        if (width > UPLOAD_SECURITY_CONFIG.maxWidth || height > UPLOAD_SECURITY_CONFIG.maxHeight) {
          return { valid: false, error: "The selected image dimensions are too large." };
        }
      }
    } catch (error) {
      return { valid: false, error: error.message || "The image could not be validated." };
    }
  }

  return {
    valid: true,
    error: "",
    dimensions,
    safeFilename: sanitizeUploadFilename(file.name),
  };
}

export function getJacketImageFingerprint(file) {
  return [file?.name, file?.size, file?.type, file?.lastModified].join(":");
}

export default validateJacketImageFile;
