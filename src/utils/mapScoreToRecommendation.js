export function mapScoreToRecommendation(score, weather, forecastAnalysis) {
const rainy =
    weather.rainChance >= 50 ||
    weather.willRain === 1 ||
    weather.condition.toLowerCase().includes("rain") ||
    forecastAnalysis.highestWindowRainChance >= 50;

const windy =
    weather.windSpeed >= 16 ||
    weather.maxWind >= 18 ||
    forecastAnalysis.highestWindowWind >= 18;

const bringAlongSuggestions = forecastAnalysis.bringAlongSuggestions || [];
const hasBringAlong = bringAlongSuggestions.length > 0;

if (score <= 0) {
    return {
    decision: "NO",
    jacketType: hasBringAlong ? "No jacket right now" : "No jacket",
    summary: hasBringAlong
        ? "You probably do not need a jacket right now, but the forecast changes what you should bring."
        : "You probably do not need a jacket for the selected window.",
    primaryItem: "No jacket",
    };
}

if (score <= 2) {
    return {
    decision: "NO",
    jacketType: hasBringAlong
        ? "No jacket right now, but bring a backup layer"
        : "No jacket / optional light layer",
    summary: hasBringAlong
        ? "You can skip a jacket now, but conditions later may make a light layer useful."
        : "You can skip the jacket, but a light layer would not hurt.",
    primaryItem: "No jacket",
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
        ? "Wear a light rain jacket because rain is part of the forecast."
        : windy
        ? "A windbreaker makes sense because wind is part of the forecast."
        : "A light jacket or hoodie is enough for the selected window.",
    primaryItem: rainy ? "Light rain jacket" : windy ? "Windbreaker" : "Light jacket",
    };
}

if (score <= 7) {
    return {
    decision: "YES",
    jacketType: rainy
        ? "Water-resistant jacket"
        : windy
        ? "Medium wind-resistant jacket"
        : "Medium jacket",
    summary: rainy
        ? "Wear a water-resistant jacket for rain and cooler conditions."
        : windy
        ? "Wear something with wind protection."
        : "A real jacket is recommended for the selected window.",
    primaryItem: rainy
        ? "Water-resistant jacket"
        : windy
        ? "Medium wind-resistant jacket"
        : "Medium jacket",
    };
}

if (score <= 10) {
    return {
    decision: "YES",
    jacketType: rainy ? "Insulated waterproof jacket" : "Insulated jacket",
    summary: rainy
        ? "Wear something warm and water-resistant."
        : "You should wear an insulated jacket.",
    primaryItem: rainy ? "Insulated waterproof jacket" : "Insulated jacket",
    };
}

return {
    decision: "YES",
    jacketType: "Heavy coat",
    summary: "Bundle up. Current and forecasted conditions are cold.",
    primaryItem: "Heavy coat",
};
}