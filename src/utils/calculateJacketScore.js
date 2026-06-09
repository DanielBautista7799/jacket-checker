import { analyzeForecast } from "./analyzeForecast";

export function calculateJacketScore({ weather, windowId = "rest_of_day" }) {
let score = 0;
const reasons = [];

const forecastAnalysis = analyzeForecast(weather, windowId);

const { feelsLike, windSpeed, rainChance } = weather;

if (feelsLike >= 80) {
score -= 4;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, which is warm right now.`);
} else if (feelsLike >= 70) {
score -= 2;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, so current conditions are mild.`);
} else if (feelsLike >= 60) {
score += 1;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, slightly cool right now.`);
} else if (feelsLike >= 50) {
score += 3;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, cool enough for a layer.`);
} else if (feelsLike >= 40) {
score += 5;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, jacket weather right now.`);
} else if (feelsLike >= 30) {
score += 7;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, definitely cold.`);
} else {
score += 9;
reasons.push(`Feels like ${Math.round(feelsLike)}°F, very cold.`);
}

if (windSpeed >= 20) {
score += 2;
reasons.push(`Current wind is strong at ${Math.round(windSpeed)} mph.`);
} else if (windSpeed >= 10) {
score += 1;
reasons.push(`Current wind is moderate at ${Math.round(windSpeed)} mph.`);
}

if (rainChance >= 60) {
score += 2;
reasons.push(`Rain chance is high today at ${rainChance}%.`);
} else if (rainChance >= 30) {
score += 1;
reasons.push(`There is some rain risk today at ${rainChance}%.`);
}

if (windowId !== "now") {
if (forecastAnalysis.lowestWindowFeelsLike <= 45 && feelsLike > 50) {
    score += 2;
    reasons.push(
    `Forecast window drops to around ${Math.round(
        forecastAnalysis.lowestWindowFeelsLike
    )}°F feels-like.`
    );
} else if (forecastAnalysis.tempDrop >= 12) {
    score += 2;
    reasons.push("Forecast shows a significant temperature drop later.");
} else if (forecastAnalysis.tempDrop >= 7) {
    score += 1;
    reasons.push("Forecast shows it may cool down later.");
}

if (forecastAnalysis.highestWindowRainChance >= 60) {
    score += 1;
    reasons.push("Forecast shows rain is likely in the selected window.");
}

if (forecastAnalysis.highestWindowWind >= 22) {
    score += 1;
    reasons.push("Forecast shows strong wind in the selected window.");
}
}

return {
score,
reasons,
forecastAnalysis,
};
}