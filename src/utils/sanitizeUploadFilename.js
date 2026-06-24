const MAX_BASENAME_LENGTH = 80;

export function sanitizeUploadFilename(filename = "jacket-image") {
  const raw = String(filename || "jacket-image").trim();
  const lastDot = raw.lastIndexOf(".");
  const base = (lastDot > 0 ? raw.slice(0, lastDot) : raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASENAME_LENGTH) || "jacket-image";
  const extension = (lastDot > 0 ? raw.slice(lastDot + 1) : "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return extension ? `${base}.${extension}` : base;
}

export default sanitizeUploadFilename;
