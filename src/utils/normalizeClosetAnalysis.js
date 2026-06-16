const ALLOWED_TYPES = new Set([
"windbreaker",
"rain_shell",
"hoodie",
"denim_jacket",
"bomber",
"leather_jacket",
"puffer",
"fleece",
"overcoat",
"heavy_coat",
"other",
]);

const ALLOWED_COLORS = new Set([
"black",
"white",
"grey",
"navy",
"blue",
"red",
"green",
"olive",
"brown",
"cream",
"beige",
"yellow",
"orange",
"purple",
"pink",
"multicolor",
"other",
]);

const ALLOWED_STYLE_TAGS = new Set([
"streetwear",
"minimal",
"athletic",
"smart_casual",
"techwear",
"vintage",
"skater",
"outdoor",
]);

const ALLOWED_WEATHER_USE = new Set([
"mild_weather",
"cool_weather",
"cold_weather",
"very_cold_weather",
"light_rain",
"heavy_rain",
"wind",
"dry_weather",
]);

function clampRating(value, fallback = 3) {
const number = Number(value);

if (!Number.isFinite(number)) {
    return fallback;
}

return Math.min(5, Math.max(1, Math.round(number)));
}

function clampConfidence(value, fallback = 0.5) {
const number = Number(value);

if (!Number.isFinite(number)) {
    return fallback;
}

return Math.min(1, Math.max(0, number));
}

function normalizeArray(value, allowedValues) {
if (!Array.isArray(value)) return [];

return [
    ...new Set(
    value.filter(
        (item) =>
        typeof item === "string" && allowedValues.has(item)
    )
    ),
];
}

export function normalizeClosetAnalysis(value) {
if (!value || typeof value !== "object") {
    throw new Error("The analysis response was invalid.");
}

return {
    name:
    typeof value.name === "string" && value.name.trim()
        ? value.name.trim().slice(0, 80)
        : "Jacket",

    category: "jacket",

    type: ALLOWED_TYPES.has(value.type)
    ? value.type
    : "other",

    primaryColor: ALLOWED_COLORS.has(value.primaryColor)
    ? value.primaryColor
    : "other",

    secondaryColor: ALLOWED_COLORS.has(value.secondaryColor)
    ? value.secondaryColor
    : null,

    warmthRating: clampRating(value.warmthRating),
    rainRating: clampRating(value.rainRating, 2),
    windRating: clampRating(value.windRating, 2),
    formalityRating: clampRating(value.formalityRating, 1),

    styleTags: normalizeArray(
    value.styleTags,
    ALLOWED_STYLE_TAGS
    ),

    description:
    typeof value.description === "string"
        ? value.description.trim().slice(0, 240)
        : "",

    weatherUse: normalizeArray(
    value.weatherUse,
    ALLOWED_WEATHER_USE
    ),

    confidence: {
    type: clampConfidence(value.confidence?.type),
    color: clampConfidence(value.confidence?.color),
    weatherRatings: clampConfidence(
        value.confidence?.weatherRatings,
        0.4
    ),
    },
};
}

export function getConfidenceLabel(value) {
if (value >= 0.8) return "High confidence";
if (value >= 0.55) return "Medium confidence";
return "Double-check";
}