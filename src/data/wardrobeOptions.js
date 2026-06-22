export const WARDROBE_CATEGORIES = [
{ value: "jacket", label: "Jacket" },
{ value: "top", label: "Top" },
{ value: "base_layer", label: "Base Layer" },
{ value: "hoodie_sweater", label: "Hoodie or Sweater" },
{ value: "bottoms", label: "Bottoms" },
{ value: "shoes", label: "Shoes" },
{ value: "accessory", label: "Accessory" },
];

export const WARDROBE_SUBTYPES = {
jacket: [
    "windbreaker",
    "rain_shell",
    "rain_jacket",
    "hoodie",
    "bomber",
    "denim_jacket",
    "leather_jacket",
    "puffer",
    "fleece",
    "fleece_jacket",
    "varsity_jacket",
    "utility_jacket",
    "overcoat",
    "trench_coat",
    "heavy_coat",
    "other",
],

top: [
    "t_shirt",
    "long_sleeve_shirt",
    "button_up_shirt",
    "polo",
    "tank_top",
    "overshirt",
    "jersey",
    "other",
],

base_layer: [
    "thermal_shirt",
    "compression_shirt",
    "undershirt",
    "thermal_leggings",
    "compression_leggings",
    "other",
],

hoodie_sweater: [
    "pullover_hoodie",
    "zip_hoodie",
    "crewneck_sweatshirt",
    "cardigan",
    "knit_sweater",
    "turtleneck",
    "quarter_zip",
    "other",
],

bottoms: [
    "jeans",
    "cargos",
    "chinos",
    "joggers",
    "sweatpants",
    "trousers",
    "shorts",
    "other",
],

shoes: [
    "sneakers",
    "high_top_sneakers",
    "running_shoes",
    "boots",
    "loafers",
    "dress_shoes",
    "sandals",
    "other",
],

accessory: [
    "beanie",
    "hat",
    "scarf",
    "gloves",
    "umbrella",
    "bag",
    "belt",
    "sunglasses",
    "other",
],
};

export const WARDROBE_COLORS = [
"black",
"white",
"grey",
"gray",
"navy",
"blue",
"light_blue",
"brown",
"tan",
"beige",
"cream",
"green",
"olive",
"red",
"burgundy",
"orange",
"yellow",
"purple",
"pink",
"silver",
"gold",
"multicolor",
"other",
];

export const WARDROBE_FITS = [
{ value: "slim", label: "Slim" },
{ value: "regular", label: "Regular" },
{ value: "relaxed", label: "Relaxed" },
{ value: "oversized", label: "Oversized" },
{ value: "athletic", label: "Athletic" },
{ value: "tailored", label: "Tailored" },
{ value: "cropped", label: "Cropped" },
{ value: "unknown", label: "Not Sure" },
];

export const WARDROBE_STYLE_TAGS = [
"streetwear",
"minimal",
"casual",
"smart_casual",
"athletic",
"outdoor",
"skater",
"workwear",
"vintage",
"preppy",
"techwear",
"formal",
];

export const WARDROBE_WEATHER_USES = [
"hot_weather",
"mild_weather",
"cool_weather",
"cold_weather",
"very_cold_weather",
"light_rain",
"heavy_rain",
"wind",
"snow",
"dry_weather",
"all_weather",
];

export const WARDROBE_MATERIALS = [
"cotton",
"polyester",
"nylon",
"wool",
"leather",
"denim",
"fleece",
"linen",
"suede",
"canvas",
"down",
"synthetic_insulation",
"waterproof_shell",
"other",
];

export const WARDROBE_SORT_OPTIONS = [
{ value: "newest", label: "Newest" },
{ value: "oldest", label: "Oldest" },
{ value: "name_asc", label: "Name A–Z" },
{ value: "name_desc", label: "Name Z–A" },
{ value: "favorites", label: "Favorites First" },
];

export function getSubtypesForCategory(category) {
return WARDROBE_SUBTYPES[category] || ["other"];
}

export function formatWardrobeLabel(value = "") {
return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}