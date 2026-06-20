import { analyzeForecast } from "./analyzeForecast";

function toFiniteNumber(value, fallback) {
if (value === null || value === undefined || value === "") {
return fallback;
}

const number = Number(value);
return Number.isFinite(number) ? number : fallback;
}

function buildConfidence({
score,
windowId,
forecastAnalysis,
}) {
const reasons = [];
let level = "high";

if (
windowId !== "now" &&
forecastAnalysis.coverageLevel === "missing"
) {
level = "low";
reasons.push(
    "The selected forecast window did not include usable hourly data."
);
} else if (
windowId !== "now" &&
forecastAnalysis.coverageLevel === "partial"
) {
level = "medium";
reasons.push(
    "Only part of the selected forecast window was available."
);
}

if (score >= 1 && score <= 4 && level === "high") {
level = "medium";
reasons.push(
    "Conditions are close to the YES or NO boundary."
);
}

if (forecastAnalysis.tempDrop >= 12 && level === "high") {
level = "medium";
reasons.push(
    "Conditions change noticeably during the selected window."
);
}

if (reasons.length === 0) {
reasons.push(
    "The selected forecast clearly supports this recommendation."
);
}

return {
level,
reasons,
};
}

export function calculateJacketScore({
weather,
windowId = "rest_of_day",
}) {
let score = 0;
const reasons = [];

const forecastAnalysis = analyzeForecast(weather, windowId);
const selectedConditions = forecastAnalysis.selectedConditions;

const feelsLike = toFiniteNumber(
selectedConditions?.feelsLike,
toFiniteNumber(weather?.feelsLike, 65)
);

const rainChance = toFiniteNumber(
selectedConditions?.rainChance,
toFiniteNumber(weather?.rainChance, 0)
);

const windSpeed = toFiniteNumber(
selectedConditions?.windSpeed,
toFiniteNumber(weather?.windSpeed, 0)
);

const lowestFeelsLike = toFiniteNumber(
selectedConditions?.lowestFeelsLike,
feelsLike
);

const windowLabel = forecastAnalysis.windowLabel.toLowerCase();

if (feelsLike >= 80) {
score -= 4;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is warm.`
);
} else if (feelsLike >= 72) {
score -= 2;
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, which is mild.`
);
} else if (feelsLike >= 66) {
reasons.push(
    `It should feel around ${Math.round(
    feelsLike
    )}°F during ${windowLabel}, so a jacket is probably unnecessary.`
);
} else if (feelsLike >= 61) {
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
    "There is some rain risk during the selected window."
);
}

if (windowId !== "now") {
if (lowestFeelsLike <= 40 && feelsLike > 40) {
    score += 2;
    reasons.push(
    `The coldest part of the window may feel like ${Math.round(
        lowestFeelsLike
    )}°F.`
    );
} else if (lowestFeelsLike <= 48 && feelsLike > 48) {
    score += 1;
    reasons.push(
    `The coldest part of the window may feel like ${Math.round(
        lowestFeelsLike
    )}°F.`
    );
}

if (forecastAnalysis.tempDrop >= 12) {
    score += 1;
    reasons.push(
    "Conditions cool down noticeably during the selected window."
    );
}
}

return {
score,
reasons,
forecastAnalysis,
selectedConditions,
confidence: buildConfidence({
    score,
    windowId,
    forecastAnalysis,
}),
};
}