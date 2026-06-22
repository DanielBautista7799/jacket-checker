import {
WARDROBE_CATEGORIES,
WARDROBE_COLORS,
WARDROBE_FITS,
WARDROBE_MATERIALS,
WARDROBE_STYLE_TAGS,
WARDROBE_WEATHER_USES,
getSubtypesForCategory,
} from "../data/wardrobeOptions";

const ALLOWED_CATEGORIES = new Set(
WARDROBE_CATEGORIES.map((category) => category.value)
);

const ALLOWED_COLORS = new Set(WARDROBE_COLORS);
const ALLOWED_FITS = new Set(WARDROBE_FITS.map((fit) => fit.value));
const ALLOWED_MATERIALS = new Set(WARDROBE_MATERIALS);
const ALLOWED_STYLE_TAGS = new Set(WARDROBE_STYLE_TAGS);
const ALLOWED_WEATHER_USES = new Set(WARDROBE_WEATHER_USES);

const CATEGORY_ALIASES = {
coat: "jacket",
outerwear: "jacket",
shirt: "top",
tee: "top",
t_shirt: "top",
base: "base_layer",
thermal: "base_layer",
hoodie: "hoodie_sweater",
sweater: "hoodie_sweater",
sweatshirt: "hoodie_sweater",
pants: "bottoms",
trousers: "bottoms",
shoe: "shoes",
footwear: "shoes",
accessories: "accessory",
};

const COLOR_ALIASES = {
charcoal: "grey",
gray: "gray",
silver_grey: "grey",
off_white: "cream",
ivory: "cream",
khaki: "tan",
maroon: "burgundy",
forest_green: "green",
army_green: "olive",
dark_green: "green",
light_blue: "light_blue",
sky_blue: "light_blue",
teal: "blue",
metallic_silver: "silver",
metallic_gold: "gold",
none: null,
};

const FIT_ALIASES = {
fitted: "slim",
standard: "regular",
classic: "regular",
loose: "relaxed",
baggy: "oversized",
boxy: "oversized",
performance: "athletic",
fitted_tailored: "tailored",
unknown_fit: "unknown",
};

const MATERIAL_ALIASES = {
synthetic: "polyester",
poly: "polyester",
polyamide: "nylon",
faux_leather: "leather",
jean: "denim",
fleece_lined: "fleece",
wool_blend: "wool",
cotton_blend: "cotton",
down_fill: "down",
synthetic_fill: "synthetic_insulation",
shell: "waterproof_shell",
waterproof: "waterproof_shell",
};

const STYLE_ALIASES = {
urban: "streetwear",
sporty: "athletic",
sportswear: "athletic",
smart: "smart_casual",
business_casual: "smart_casual",
retro: "vintage",
gorpcore: "outdoor",
functional: "techwear",
work: "workwear",
};

const WEATHER_ALIASES = {
hot: "hot_weather",
warm_weather: "hot_weather",
mild: "mild_weather",
cool: "cool_weather",
cold: "cold_weather",
winter: "very_cold_weather",
very_cold: "very_cold_weather",
rain: "light_rain",
rainy: "light_rain",
heavy_rainfall: "heavy_rain",
windy: "wind",
dry: "dry_weather",
versatile: "all_weather",
};

const SUBTYPE_ALIASES = {
jacket: {
    shell_jacket: "rain_shell",
    shell: "rain_shell",
    raincoat: "rain_jacket",
    track_jacket: "windbreaker",
    jean_jacket: "denim_jacket",
    leather: "leather_jacket",
    down_jacket: "puffer",
    parka: "heavy_coat",
    wool_coat: "overcoat",
    varsity: "varsity_jacket",
    chore_jacket: "utility_jacket",
},
top: {
    tshirt: "t_shirt",
    tee: "t_shirt",
    long_sleeve: "long_sleeve_shirt",
    button_down: "button_up_shirt",
    button_up: "button_up_shirt",
    tank: "tank_top",
    shirt_jacket: "overshirt",
},
base_layer: {
    thermal_top: "thermal_shirt",
    compression_top: "compression_shirt",
    base_layer_top: "undershirt",
    thermal_bottoms: "thermal_leggings",
    compression_bottoms: "compression_leggings",
},
hoodie_sweater: {
    hoodie: "pullover_hoodie",
    pullover: "pullover_hoodie",
    zip_up_hoodie: "zip_hoodie",
    sweatshirt: "crewneck_sweatshirt",
    crewneck: "crewneck_sweatshirt",
    sweater: "knit_sweater",
    mock_neck: "turtleneck",
    quarterzip: "quarter_zip",
},
bottoms: {
    cargo_pants: "cargos",
    cargo: "cargos",
    denim: "jeans",
    sweat_pants: "sweatpants",
    dress_pants: "trousers",
    athletic_shorts: "shorts",
},
shoes: {
    sneaker: "sneakers",
    high_tops: "high_top_sneakers",
    trainers: "running_shoes",
    running_sneakers: "running_shoes",
    boot: "boots",
    loafer: "loafers",
    formal_shoes: "dress_shoes",
    slides: "sandals",
},
accessory: {
    cap: "hat",
    baseball_cap: "hat",
    winter_hat: "beanie",
    mittens: "gloves",
    backpack: "bag",
    tote: "bag",
    shades: "sunglasses",
},
};

function normalizeToken(value) {
if (typeof value !== "string") {
    return "";
}

return value
    .trim()
    .toLowerCase()
    .replace(/[&/]+/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clampRating(value, fallback = 1) {
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

function cleanText(value, fallback, maximumLength) {
if (typeof value !== "string") {
    return fallback;
}

const cleaned = value.trim().replace(/\s+/g, " ");

return cleaned ? cleaned.slice(0, maximumLength) : fallback;
}

function normalizeCategory(value) {
const token = normalizeToken(value);
const normalized = CATEGORY_ALIASES[token] || token;

return ALLOWED_CATEGORIES.has(normalized) ? normalized : "jacket";
}

function normalizeSubtype(value, category) {
const allowedSubtypes = getSubtypesForCategory(category);
const allowedSet = new Set(allowedSubtypes);
const token = normalizeToken(value);
const alias = SUBTYPE_ALIASES[category]?.[token] || token;

return allowedSet.has(alias) ? alias : "other";
}

function normalizeColor(value, fallback = "other") {
const token = normalizeToken(value);

if (!token) {
    return fallback;
}

const alias = Object.prototype.hasOwnProperty.call(COLOR_ALIASES, token)
    ? COLOR_ALIASES[token]
    : token;

if (alias === null) {
    return null;
}

return ALLOWED_COLORS.has(alias) ? alias : fallback;
}

function normalizeFit(value) {
const token = normalizeToken(value);
const alias = FIT_ALIASES[token] || token;

return ALLOWED_FITS.has(alias) ? alias : "unknown";
}

function normalizeArray(value, allowedSet, aliases = {}, maximumItems = 6) {
if (!Array.isArray(value)) {
    return [];
}

const normalized = value
    .map((item) => {
    const token = normalizeToken(item);
    const alias = aliases[token] || token;
    return allowedSet.has(alias) ? alias : null;
    })
    .filter(Boolean);

return [...new Set(normalized)].slice(0, maximumItems);
}

function normalizeConfidence(value) {
const confidence = value && typeof value === "object" ? value : {};

return {
    category: clampConfidence(confidence.category, 0.5),
    subtype: clampConfidence(confidence.subtype ?? confidence.type, 0.5),
    color: clampConfidence(confidence.color, 0.5),
    materials: clampConfidence(confidence.materials, 0.4),
    weatherRatings: clampConfidence(
    confidence.weatherRatings ?? confidence.weather_ratings,
    0.4
    ),
    overall: clampConfidence(confidence.overall, 0.5),
};
}

export function normalizeWardrobeAnalysis(value) {
if (!value || typeof value !== "object") {
    throw new Error("The wardrobe analysis response was invalid.");
}

const category = normalizeCategory(value.category);
const subtype = normalizeSubtype(value.subtype ?? value.type, category);
const primaryColor = normalizeColor(
    value.primaryColor ?? value.primary_color,
    "other"
);
const secondaryColor = normalizeColor(
    value.secondaryColor ?? value.secondary_color,
    null
);

return {
    name: cleanText(value.name, "Wardrobe item", 80),
    category,
    subtype,
    primaryColor: primaryColor || "other",
    secondaryColor:
    secondaryColor && secondaryColor !== primaryColor
        ? secondaryColor
        : null,
    materials: normalizeArray(
    value.materials,
    ALLOWED_MATERIALS,
    MATERIAL_ALIASES,
    6
    ),
    warmthRating: clampRating(
    value.warmthRating ?? value.warmth_rating,
    1
    ),
    rainRating: clampRating(value.rainRating ?? value.rain_rating, 1),
    windRating: clampRating(value.windRating ?? value.wind_rating, 1),
    formalityRating: clampRating(
    value.formalityRating ?? value.formality_rating,
    1
    ),
    fit: normalizeFit(value.fit),
    styleTags: normalizeArray(
    value.styleTags ?? value.style_tags,
    ALLOWED_STYLE_TAGS,
    STYLE_ALIASES,
    6
    ),
    weatherUse: normalizeArray(
    value.weatherUse ?? value.weather_use,
    ALLOWED_WEATHER_USES,
    WEATHER_ALIASES,
    6
    ),
    description: cleanText(value.description, "", 240),
    confidence: normalizeConfidence(value.confidence),
};
}

export function getWardrobeConfidenceLabel(value) {
const number = Number(value);

if (Number.isFinite(number) && number >= 0.8) {
    return "High confidence";
}

if (Number.isFinite(number) && number >= 0.55) {
    return "Medium confidence";
}

return "Double-check";
}