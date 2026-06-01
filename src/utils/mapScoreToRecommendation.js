export function mapScoreToRecommendation(score, weather, forecastAnalysis) {
const rainy =
    weather.rainChance >= 50 ||
    weather.willRain === 1 ||
    weather.condition.toLowerCase().includes("rain") ||
    forecastAnalysis.highestUpcomingRainChance >= 50;

const windy = weather.windSpeed >= 16 || weather.maxWind >= 18;

if (score <= 0) {
    return {
    decision: "NO",
    jacketType: "No jacket",
    summary: "You probably do not need a jacket right now.",
    primaryItem: "No jacket",
    };
}

if (score <= 2) {
    return {
    decision: "NO",
    jacketType: rainy
        ? "No jacket, but bring a rain shell"
        : windy
        ? "No jacket, but consider a windbreaker"
        : "No jacket / optional light layer",
    summary: rainy
        ? "Current conditions do not require a jacket, but rain later could change what you bring."
        : windy
        ? "Current conditions are mild, but wind could make it feel cooler later."
        : "You can skip the jacket, but a light layer would not hurt if you will be out for a while.",
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
        ? "Wear a light rain jacket because rain is possible."
        : windy
        ? "A windbreaker makes the most sense because wind is part of the forecast."
        : "A light jacket or hoodie is enough.",
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
        ? "Wear a water-resistant jacket for the rain and cooler conditions."
        : windy
        ? "Wear something with some wind protection."
        : "A real jacket is recommended.",
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
    jacketType: rainy
        ? "Insulated waterproof jacket"
        : "Insulated jacket",
    summary: rainy
        ? "Wear something warm and water-resistant."
        : "You should wear an insulated jacket.",
    primaryItem: rainy ? "Insulated waterproof jacket" : "Insulated jacket",
    };
}

return {
    decision: "YES",
    jacketType: "Heavy coat",
    summary: "Bundle up. Current and projected conditions are cold.",
    primaryItem: "Heavy coat",
};
}