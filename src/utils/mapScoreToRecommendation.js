function toFiniteNumber(value, fallback) {
if (value === null || value === undefined || value === "") {
    return fallback;
}

const number = Number(value);
return Number.isFinite(number) ? number : fallback;
}

function getSelectedConditions(weather, forecastAnalysis) {
const selected = forecastAnalysis?.selectedConditions || {};

return {
    feelsLike: toFiniteNumber(
    selected.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
    ),

    lowestFeelsLike: toFiniteNumber(
    selected.lowestFeelsLike,
    toFiniteNumber(
        forecastAnalysis?.lowestWindowFeelsLike,
        toFiniteNumber(weather?.feelsLike, 65)
    )
    ),

    rainChance: toFiniteNumber(
    selected.rainChance,
    toFiniteNumber(
        forecastAnalysis?.highestWindowRainChance,
        toFiniteNumber(weather?.rainChance, 0)
    )
    ),

    windSpeed: toFiniteNumber(
    selected.windSpeed,
    toFiniteNumber(
        forecastAnalysis?.highestWindowWind,
        toFiniteNumber(weather?.windSpeed, 0)
    )
    ),

    condition: String(
    selected.condition || weather?.condition || ""
    ).toLowerCase(),
};
}

function findSuggestion(forecastAnalysis, allowedItems) {
const suggestions =
    forecastAnalysis?.bringAlongSuggestions || [];

const allowed = new Set(
    allowedItems.map((item) => item.toLowerCase())
);

return (
    suggestions.find((suggestion) =>
    allowed.has(String(suggestion.item).toLowerCase())
    ) || null
);
}

function buildOptionalLayer({
rainy,
windy,
selectedConditions,
forecastAnalysis,
}) {
if (rainy) {
    return (
    findSuggestion(forecastAnalysis, [
        "Light rain shell",
        "Packable rain layer",
    ]) || {
        item: "Packable rain layer",
        reason:
        "Warmth may not be necessary, but rain protection could still be useful.",
    }
    );
}

if (windy) {
    return (
    findSuggestion(forecastAnalysis, [
        "Light windbreaker",
    ]) || {
        item: "Light windbreaker",
        reason:
        "A thin wind-resistant layer could make the selected window more comfortable.",
    }
    );
}

if (selectedConditions.lowestFeelsLike <= 62) {
    return (
    findSuggestion(forecastAnalysis, ["Light layer"]) || {
        item: "Light layer",
        reason:
        "A hoodie, overshirt, or thin layer is optional if you get cold easily.",
    }
    );
}

return null;
}

export function mapScoreToRecommendation(
score,
weather,
forecastAnalysis
) {
const selectedConditions = getSelectedConditions(
    weather,
    forecastAnalysis
);

const rainy =
    selectedConditions.rainChance >= 50 ||
    selectedConditions.condition.includes("rain") ||
    selectedConditions.condition.includes("drizzle") ||
    selectedConditions.condition.includes("shower");

const windy = selectedConditions.windSpeed >= 18;

const optionalLayer = buildOptionalLayer({
    rainy,
    windy,
    selectedConditions,
    forecastAnalysis,
});

if (score <= 0) {
    let summary =
    "You should be comfortable without a jacket for the selected window.";

    if (rainy) {
    summary =
        "You do not need a jacket for warmth, but a light rain layer may still be useful.";
    } else if (windy) {
    summary =
        "You do not need a jacket for warmth, but a light wind layer may still be useful.";
    }

    return {
    decision: "NO",
    jacketType: "No jacket",
    primaryItem: "No jacket",
    summary,
    optionalLayer,
    };
}

if (score <= 2) {
    return {
    decision: "NO",
    jacketType: "No jacket needed",
    primaryItem: "No jacket",
    summary:
        "You probably do not need a jacket, but a light backup layer could be useful depending on your comfort.",
    optionalLayer,
    };
}

if (score <= 4) {
    return {
    decision: "YES",
    jacketType: rainy
        ? "Light rain jacket"
        : windy
        ? "Windbreaker"
        : "Light jacket or hoodie",
    summary: rainy
        ? "Wear a light rain jacket because rain is part of the selected forecast."
        : windy
        ? "A windbreaker makes sense because the selected window may be breezy."
        : "A light jacket or hoodie should be enough.",
    primaryItem: rainy
        ? "Light rain jacket"
        : windy
        ? "Windbreaker"
        : "Light jacket",
    optionalLayer: null,
    };
}

if (score <= 7) {
    return {
    decision: "YES",
    jacketType: rainy
        ? "Water-resistant jacket"
        : windy
        ? "Wind-resistant jacket"
        : "Medium jacket",
    summary: rainy
        ? "Wear a water-resistant jacket for the cooler, wetter conditions."
        : windy
        ? "Wear something with reliable wind protection."
        : "A real jacket is recommended for the selected window.",
    primaryItem: rainy
        ? "Water-resistant jacket"
        : windy
        ? "Wind-resistant jacket"
        : "Medium jacket",
    optionalLayer: null,
    };
}

if (score <= 10) {
    return {
    decision: "YES",
    jacketType: rainy
        ? "Insulated waterproof jacket"
        : "Insulated jacket",
    summary: rainy
        ? "Wear something warm and water-resistant."
        : "You should wear an insulated jacket.",
    primaryItem: rainy
        ? "Insulated waterproof jacket"
        : "Insulated jacket",
    optionalLayer: null,
    };
}

return {
    decision: "YES",
    jacketType: "Heavy coat",
    summary:
    "Bundle up. The selected forecast window is very cold.",
    primaryItem: "Heavy coat",
    optionalLayer: null,
};
}