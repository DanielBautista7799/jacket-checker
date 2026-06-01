import { analyzeForecast } from "./analyzeForecast";

export function calculateJacketScore({ weather }) {
let score = 0;
const reasons = [];

const forecastAnalysis = analyzeForecast(weather);

const {
feelsLike,
windSpeed,
rainChance,
} = weather;

// Current feels-like temperature
if (feelsLike >= 80) {
score -= 4;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, which is warm right now.`);
} else if (feelsLike >= 70) {
score -= 2;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, so current conditions are mild.`);
} else if (feelsLike >= 60) {
score += 1;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, slightly cool.`);
} else if (feelsLike >= 50) {
score += 3;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, cool enough for a layer.`);
} else if (feelsLike >= 40) {
score += 5;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, jacket weather.`);
} else if (feelsLike >= 30) {
score += 7;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, definitely cold.`);
} else {
score += 9;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, very cold.`);
}

// Current wind
if (windSpeed >= 20) {
score += 2;
reasons.push(`Current wind is strong at ${Math.round(windSpeed)} mph.`);
} else if (windSpeed >= 10) {
score += 1;
reasons.push(`Current wind is moderate at ${Math.round(windSpeed)} mph.`);
}

// Current rain chance
if (rainChance >= 60) {
score += 2;
reasons.push(`Rain chance is high at ${rainChance}%.`);
} else if (rainChance >= 30) {
score += 1;
reasons.push(`There is some rain risk at ${rainChance}%.`);
}

// Forecast adjustment
if (forecastAnalysis.tempDrop >= 12) {
score += 2;
reasons.push("Forecast shows a significant temperature drop later.");
} else if (forecastAnalysis.tempDrop >= 7) {
score += 1;
reasons.push("Forecast shows it may cool down later.");
}

if (forecastAnalysis.highestUpcomingRainChance >= 60) {
score += 1;
reasons.push("Forecast shows rain is likely later.");
}

return {
score,
reasons,
forecastAnalysis,
};
}