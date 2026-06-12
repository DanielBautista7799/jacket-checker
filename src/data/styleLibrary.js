export const styleProfiles = {
streetwear: {
    label: "Streetwear",
    defaultTop: "graphic tee or hoodie",
    defaultBottoms: "cargos",
    defaultShoes: "Jordan 1s",
    tone: "casual, layered, and street-ready",
},
minimal: {
    label: "Minimal",
    defaultTop: "plain tee or lightweight knit",
    defaultBottoms: "straight-leg pants",
    defaultShoes: "clean sneakers",
    tone: "simple, clean, and intentional",
},
athletic: {
    label: "Athletic",
    defaultTop: "performance tee or sweatshirt",
    defaultBottoms: "joggers",
    defaultShoes: "running shoes",
    tone: "comfortable, functional, and easy to move in",
},
smart_casual: {
    label: "Smart casual",
    defaultTop: "plain tee, knit, or button-down",
    defaultBottoms: "chinos or trousers",
    defaultShoes: "boots or loafers",
    tone: "clean, polished, and flexible",
},
techwear: {
    label: "Techwear",
    defaultTop: "black base layer or technical hoodie",
    defaultBottoms: "technical cargos",
    defaultShoes: "black sneakers or boots",
    tone: "functional, dark, and weather-ready",
},
vintage: {
    label: "Vintage",
    defaultTop: "washed tee or crewneck",
    defaultBottoms: "straight-leg jeans",
    defaultShoes: "retro sneakers or boots",
    tone: "casual, worn-in, and relaxed",
},
skater: {
    label: "Skater",
    defaultTop: "oversized tee or hoodie",
    defaultBottoms: "loose jeans",
    defaultShoes: "skate shoes",
    tone: "loose, casual, and laid-back",
},
outdoor: {
    label: "Outdoor",
    defaultTop: "thermal or fleece layer",
    defaultBottoms: "utility pants",
    defaultShoes: "trail shoes or boots",
    tone: "practical, warm, and weather-focused",
},
};

export const colorPalettes = {
black: {
    label: "Black",
    primary: "black",
    neutral: "grey",
    accent: "white",
    note: "Black keeps the outfit easy to style and works with almost any jacket.",
},
white: {
    label: "White",
    primary: "white",
    neutral: "grey",
    accent: "navy",
    note: "White brightens the fit and pairs best with clean neutrals.",
},
grey: {
    label: "Grey",
    primary: "grey",
    neutral: "black",
    accent: "white",
    note: "Grey keeps the outfit balanced and works well for layering.",
},
navy: {
    label: "Navy",
    primary: "navy",
    neutral: "white",
    accent: "grey",
    note: "Navy gives the outfit a cleaner, slightly more polished look.",
},
earth_tones: {
    label: "Earth tones",
    primary: "olive or brown",
    neutral: "cream",
    accent: "black",
    note: "Earth tones make the outfit feel warmer and more natural.",
},
bold: {
    label: "Bold colors",
    primary: "statement color",
    neutral: "black",
    accent: "white",
    note: "A bold color works best when the rest of the outfit stays simple.",
},
};

export const jacketStyleLibrary = [
{
    id: "windbreaker",
    label: "Windbreaker",
    matches: ["windbreaker", "light rain jacket", "light jacket"],
    warmth: 2,
    rainProtection: 3,
    windProtection: 5,
    styleTags: ["streetwear", "athletic", "techwear", "outdoor"],
    bestFor: ["wind", "light_rain", "mild_weather"],
},
{
    id: "rain_shell",
    label: "Rain shell",
    matches: ["rain jacket", "water-resistant jacket", "light rain jacket"],
    warmth: 2,
    rainProtection: 5,
    windProtection: 3,
    styleTags: ["outdoor", "techwear", "athletic", "minimal"],
    bestFor: ["rain", "wind", "mild_weather"],
},
{
    id: "hoodie",
    label: "Hoodie",
    matches: ["hoodie", "light jacket or hoodie", "light layer"],
    warmth: 3,
    rainProtection: 1,
    windProtection: 1,
    styleTags: ["streetwear", "skater", "athletic", "vintage"],
    bestFor: ["cool_weather", "casual"],
},
{
    id: "denim_jacket",
    label: "Denim jacket",
    matches: ["light jacket", "medium jacket"],
    warmth: 3,
    rainProtection: 1,
    windProtection: 2,
    styleTags: ["vintage", "streetwear", "minimal", "skater"],
    bestFor: ["cool_weather", "dry_weather"],
},
{
    id: "bomber",
    label: "Bomber jacket",
    matches: ["light jacket", "medium jacket", "wind-resistant jacket"],
    warmth: 3,
    rainProtection: 1,
    windProtection: 3,
    styleTags: ["streetwear", "smart_casual", "minimal"],
    bestFor: ["cool_weather", "wind", "going_out"],
},
{
    id: "leather_jacket",
    label: "Leather jacket",
    matches: ["medium jacket"],
    warmth: 4,
    rainProtection: 1,
    windProtection: 4,
    styleTags: ["streetwear", "smart_casual", "vintage"],
    bestFor: ["cool_weather", "wind", "going_out"],
},
{
    id: "puffer",
    label: "Puffer jacket",
    matches: ["insulated jacket", "heavy coat"],
    warmth: 5,
    rainProtection: 2,
    windProtection: 4,
    styleTags: ["streetwear", "outdoor", "athletic"],
    bestFor: ["cold_weather", "wind"],
},
{
    id: "fleece",
    label: "Fleece",
    matches: ["light jacket", "medium jacket", "insulated jacket"],
    warmth: 4,
    rainProtection: 1,
    windProtection: 2,
    styleTags: ["outdoor", "athletic", "minimal"],
    bestFor: ["cold_weather", "dry_weather"],
},
{
    id: "overcoat",
    label: "Overcoat",
    matches: ["medium jacket", "heavy coat"],
    warmth: 5,
    rainProtection: 1,
    windProtection: 3,
    styleTags: ["smart_casual", "minimal", "european_clean"],
    bestFor: ["cold_weather", "polished"],
},
{
    id: "heavy_coat",
    label: "Heavy coat",
    matches: ["heavy coat"],
    warmth: 5,
    rainProtection: 2,
    windProtection: 4,
    styleTags: ["outdoor", "minimal", "smart_casual"],
    bestFor: ["very_cold_weather"],
},
];

export function findStyleProfile(stylePreference) {
return styleProfiles[stylePreference] || styleProfiles.streetwear;
}

export function findColorPalette(preferredColor) {
return colorPalettes[preferredColor] || colorPalettes.black;
}

export function findMatchingJacket(jacketType = "", stylePreference = "streetwear") {
const normalizedType = jacketType.toLowerCase();

const exactMatch = jacketStyleLibrary.find((jacket) =>
    jacket.matches.some((match) => normalizedType.includes(match))
);

if (exactMatch) return exactMatch;

const styleMatch = jacketStyleLibrary.find((jacket) =>
    jacket.styleTags.includes(stylePreference)
);

return styleMatch || jacketStyleLibrary[0];
}