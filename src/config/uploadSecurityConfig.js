export const UPLOAD_SECURITY_CONFIG = Object.freeze({
  allowedMimeTypes: Object.freeze([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  allowedExtensions: Object.freeze(["jpg", "jpeg", "png", "webp"]),
  maxBytes: 5 * 1024 * 1024,
  minWidth: 240,
  minHeight: 240,
  maxWidth: 12000,
  maxHeight: 12000,
  maxImagesPerJacket: 8,
});
