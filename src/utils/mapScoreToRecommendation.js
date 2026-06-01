export function mapScoreToRecommendation(score, weather) {
const rainy =
    weather.rainChance >= 50 ||
    weather.willRain === 1 ||
    weather.condition.toLowerCase().includes("rain");

if (score <= 0) {
    return {
    decision: "NO",
    jacketType: "No jacket",
    summary: "You probably do not need a jacket right now.",
    };
}

if (score <= 2) {
    return {
    decision: "NO",
    jacketType: "No jacket / optional light layer",
    summary:
        "You can skip the jacket, but a light layer would not hurt if you get cold easily.",
    };
}

if (score <= 4) {
    return {
    decision: "YES",
    jacketType: rainy ? "Light rain jacket" : "Light jacket or hoodie",
    summary: rainy
        ? "Wear a light rain jacket because rain is possible."
        : "A light jacket or hoodie is enough.",
    };
}

if (score <= 7) {
    return {
    decision: "YES",
    jacketType: rainy ? "Water-resistant jacket" : "Medium jacket",
    summary: rainy
        ? "Wear a water-resistant jacket for the rain and cooler conditions."
        : "A real jacket is recommended.",
    };
}

if (score <= 10) {
    return {
    decision: "YES",
    jacketType: rainy ? "Insulated waterproof jacket" : "Insulated jacket",
    summary: rainy
        ? "Wear something warm and water-resistant."
        : "You should wear an insulated jacket.",
    };
}

return {
    decision: "YES",
    jacketType: "Heavy coat",
    summary: "Bundle up. Current and projected conditions are cold.",
};
}