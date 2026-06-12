import {
findColorPalette,
findMatchingJacket,
findStyleProfile,
} from "../data/styleLibrary";

function formatShoes(shoes) {
const shoeMap = {
    jordans: "Jordan 1s",
    sneakers: "clean sneakers",
    boots: "boots",
    loafers: "loafers",
    running_shoes: "running shoes",
};

return shoeMap[shoes] || "sneakers";
}

function formatBottoms(bottoms) {
const bottomsMap = {
    cargos: "cargos",
    jeans: "straight-leg jeans",
    chinos: "chinos",
    joggers: "joggers",
    trousers: "trousers",
};

return bottomsMap[bottoms] || "pants";
}

function getTopLayer({ weather, stylePreference, fitPreference, preferredColor }) {
const feelsLike = weather?.feelsLike ?? 65;
const color =
    preferredColor === "earth_tones"
    ? "cream"
    : preferredColor === "bold"
    ? "plain black"
    : preferredColor;

if (feelsLike < 45) {
    if (stylePreference === "streetwear" || stylePreference === "skater") {
    return `${color} hoodie`;
    }

    if (stylePreference === "smart_casual" || stylePreference === "minimal") {
    return `${color} knit or thermal`;
    }

    return `${color} warm base layer`;
}

if (feelsLike < 60) {
    if (fitPreference === "layered") {
    return `${color} tee with a light hoodie`;
    }

    if (stylePreference === "smart_casual") {
    return `${color} long sleeve`;
    }

    return `${color} tee or crewneck`;
}

if (stylePreference === "minimal" || stylePreference === "smart_casual") {
    return `${color} plain tee`;
}

return `${color} tee`;
}

function getAccessory(weather) {
const rainChance = weather?.rainChance ?? 0;
const windSpeed = weather?.windSpeed ?? 0;
const feelsLike = weather?.feelsLike ?? 65;

if (rainChance >= 50) {
    return "small umbrella or water-resistant bag";
}

if (windSpeed >= 18) {
    return "cap or wind-resistant layer";
}

if (feelsLike < 40) {
    return "beanie";
}

return null;
}

function getInfluenceNote(styleInfluence) {
const notes = {
    american_streetwear: "leans casual and streetwear-focused",
    korean_casual: "leans clean, soft, and balanced",
    japanese_minimal: "leans minimal and intentional",
    european_clean: "leans polished and simple",
    skater: "leans loose and casual",
    outdoor: "leans practical and weather-ready",
    athletic: "leans comfortable and movement-friendly",
    techwear: "leans dark, functional, and weather-focused",
};

return notes[styleInfluence] || "matches your saved style influence";
}

export function generateStyleSuggestion({
recommendation,
weather,
profile,
}) {
if (!recommendation || !profile) return null;

const stylePreference = profile.style_preference || "streetwear";
const fitPreference = profile.fit_preference || "relaxed";
const preferredColor = profile.preferred_color || "black";
const favoriteShoes = profile.favorite_shoes || "jordans";
const defaultBottoms = profile.default_bottoms || "cargos";
const styleInfluence = profile.style_influence || "american_streetwear";

const styleProfile = findStyleProfile(stylePreference);
const colorPalette = findColorPalette(preferredColor);
const jacketMatch = findMatchingJacket(
    recommendation.primaryItem || recommendation.jacketType,
    stylePreference
);

const top = getTopLayer({
    weather,
    stylePreference,
    fitPreference,
    preferredColor: colorPalette.primary,
});

const bottoms = formatBottoms(defaultBottoms);
const shoes = formatShoes(favoriteShoes);
const accessory = getAccessory(weather);

const outfitTitle = `${styleProfile.label} ${jacketMatch.label.toLowerCase()} fit`;

const pieces = [
    top,
    bottoms,
    shoes,
    accessory,
].filter(Boolean);

return {
    outfitTitle,
    jacketStyle: jacketMatch.label,
    pieces,
    top,
    bottoms,
    shoes,
    accessory,
    colorNote: colorPalette.note,
    reason: `This matches your ${styleProfile.label.toLowerCase()} preference, ${fitPreference} fit, and ${getInfluenceNote(
    styleInfluence
    )}.`,
};
}