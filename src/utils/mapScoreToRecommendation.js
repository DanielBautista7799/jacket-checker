export function mapScoreToRecommendation(
score,
weather,
forecastAnalysis
) {
const conditionText = String(
    weather?.condition || ""
).toLowerCase();

const rainy =
    Number(weather?.rainChance) >= 50 ||
    weather?.willRain === 1 ||
    conditionText.includes("rain") ||
    Number(
    forecastAnalysis?.highestWindowRainChance
    ) >= 50;

const windy =
    Number(weather?.windSpeed) >= 16 ||
    Number(weather?.maxWind) >= 18 ||
    Number(
    forecastAnalysis?.highestWindowWind
    ) >= 18;

const lowestFeelsLike = Number(
    forecastAnalysis?.lowestWindowFeelsLike
);

const bringAlongSuggestions =
    forecastAnalysis?.bringAlongSuggestions || [];

const lightLayerSuggestion =
    bringAlongSuggestions.find((suggestion) =>
    [
        "light layer",
        "light windbreaker",
        "light rain shell",
        "packable rain layer",
    ].includes(
        String(suggestion.item).toLowerCase()
    )
    ) || null;

if (score <= 0) {
    return {
    decision: "NO",
    jacketType: "No jacket",
    primaryItem: "No jacket",
    summary:
        "You should be comfortable without a jacket for the selected window.",
    optionalLayer: lightLayerSuggestion,
    };
}

if (score <= 2) {
    const fallbackLayer =
    Number.isFinite(lowestFeelsLike) &&
    lowestFeelsLike <= 62
        ? {
            item: "Light layer",
            reason:
            "A hoodie, overshirt, or thin layer is optional if you get cold easily.",
        }
        : null;

    return {
    decision: "NO",
    jacketType: "No jacket needed",
    primaryItem: "No jacket",
    summary:
        "You probably do not need a jacket, but a light layer could be useful depending on your comfort.",
    optionalLayer:
        lightLayerSuggestion || fallbackLayer,
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