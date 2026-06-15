import { supabase } from "../lib/supabaseClient";

const BUCKET_NAME = "closet-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
"image/jpeg",
"image/png",
"image/webp",
]);

function getExtension(file) {
const extensionFromName = file.name.split(".").pop()?.toLowerCase();

if (extensionFromName && ["jpg", "jpeg", "png", "webp"].includes(extensionFromName)) {
return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
}

const extensionByType = {
"image/jpeg": "jpg",
"image/png": "png",
"image/webp": "webp",
};

return extensionByType[file.type] || "jpg";
}

export function validateClosetImage(file) {
if (!file) {
return {
    valid: true,
    error: "",
};
}

if (!ALLOWED_TYPES.has(file.type)) {
return {
    valid: false,
    error: "Use a JPG, PNG, or WebP image.",
};
}

if (file.size > MAX_FILE_SIZE) {
return {
    valid: false,
    error: "The image must be smaller than 5 MB.",
};
}

return {
valid: true,
error: "",
};
}

export async function uploadClosetImage({ file, userId }) {
if (!file) return null;

if (!userId) {
throw new Error("You must be signed in to upload an image.");
}

const validation = validateClosetImage(file);

if (!validation.valid) {
throw new Error(validation.error);
}

const extension = getExtension(file);
const imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

const { error } = await supabase.storage
.from(BUCKET_NAME)
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

export async function deleteClosetImage(imagePath) {
if (!imagePath) return;

const { error } = await supabase.storage
.from(BUCKET_NAME)
.remove([imagePath]);

if (error) {
throw error;
}
}

export async function createClosetImageUrl(
imagePath,
expiresInSeconds = 60 * 60
) {
if (!imagePath) return null;

const { data, error } = await supabase.storage
.from(BUCKET_NAME)
.createSignedUrl(imagePath, expiresInSeconds);

if (error) {
throw error;
}

return data.signedUrl;
}