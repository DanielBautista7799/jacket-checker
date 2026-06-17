import { analyzeForecast } from "./analyzeForecast";

function getSelectedFeelsLike(
weather,
forecastAnalysis,
windowId
) {
if (windowId === "now") {
return Number(weather?.feelsLike) || 65;
}

return (
Number(forecastAnalysis.averageWindowFeelsLike) ||
Number(weather?.feelsLike) ||
65
);
}

function getSelectedRainChance(
weather,
forecastAnalysis,
windowId
) {
if (windowId === "now") {
return Number(weather?.rainChance) || 0;
}

return (
Number(
    forecastAnalysis.highestWindowRainChance
) ||
Number(weather?.rainChance) ||
0
);
}

function getSelectedWind(
weather,
forecastAnalysis,
windowId
) {
if (windowId === "now") {
return Number(weather?.windSpeed) || 0;
}

return (
Number(forecastAnalysis.highestWindowWind) ||
Number(weather?.windSpeed) ||
0
);
}

export function calculateJacketScore({
weather,
windowId = "rest_of_day",
}) {
let score = 0;
const reasons = [];

const forecastAnalysis = analyzeForecast(
weather,
windowId
);

const feelsLike = getSelectedFeelsLike(
weather,
forecastAnalysis,
windowId
);

const rainChance = getSelectedRainChance(
weather,
forecastAnalysis,
windowId
);

const windSpeed = getSelectedWind(
weather,
forecastAnalysis,
windowId
);

const windowLabel =
forecastAnalysis.windowLabel.toLowerCase();

if (feelsLike >= 80) {
score -= 4;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is warm.`
);
} else if (feelsLike >= 70) {
score -= 2;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is mild.`
);
} else if (feelsLike >= 62) {
score += 1;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, so a light layer is optional.`
);
} else if (feelsLike >= 52) {
score += 3;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is cool.`
);
} else if (feelsLike >= 42) {
score += 5;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is jacket weather.`
);
} else if (feelsLike >= 32) {
score += 7;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is cold.`
);
} else {
score += 9;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is very cold.`
);
}

if (windSpeed >= 22) {
score += 2;
reasons.push(
    `Wind may reach ${Math.round(
    windSpeed
    )} mph during the selected window.`
);
} else if (windSpeed >= 14) {
score += 1;
reasons.push(
    `Wind may reach ${Math.round(
    windSpeed
    )} mph during the selected window.`
);
}

if (rainChance >= 60) {
score += 2;
reasons.push(
    `Rain chance may reach ${Math.round(
    rainChance
    )}% during the selected window.`
);
} else if (rainChance >= 35) {
score += 1;
reasons.push(
    `There is some rain risk during the selected window.`
);
}

if (
windowId !== "now" &&
forecastAnalysis.lowestWindowFeelsLike <= 45
) {
score += 1;
reasons.push(
    `The coolest part of the window may feel like ${Math.round(
    forecastAnalysis.lowestWindowFeelsLike
    )}°F.`
);
}

return {
score,
reasons,
forecastAnalysis,
};
}