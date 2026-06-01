export function calculateJacketScore({ weather }) {
let score = 0;
const reasons = [];
const forecastNotes = [];

const { feelsLike, windSpeed, rainChance, dailyLow, upcomingHours = [] } =
    weather;

const lowestUpcomingFeelsLike =
    upcomingHours.length > 0
    ? Math.min(...upcomingHours.map((hour) => hour.feelsLike))
    : feelsLike;

const tempDrop = feelsLike - lowestUpcomingFeelsLike;

if (feelsLike >= 80) {
    score -= 4;
    reasons.push(`Feels like ${Math.round(feelsLike)}°F, which is warm.`);
} else if (feelsLike >= 70) {
    score -= 2;
    reasons.push(`Feels like ${Math.round(feelsLike)}°F, so conditions are mild.`);
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

if (windSpeed >= 20) {
    score += 2;
    reasons.push(`Strong winds around ${Math.round(windSpeed)} mph.`);
} else if (windSpeed >= 10) {
    score += 1;
    reasons.push(`Moderate wind around ${Math.round(windSpeed)} mph.`);
}

if (rainChance >= 60) {
    score += 2;
    reasons.push(`High rain chance at ${rainChance}%.`);
    forecastNotes.push("Rain is likely, so water resistance matters.");
} else if (rainChance >= 30) {
    score += 1;
    reasons.push(`Some rain risk at ${rainChance}%.`);
    forecastNotes.push("There is some rain risk later.");
}

if (tempDrop >= 10) {
    score += 2;
    forecastNotes.push(
    `Temperature is projected to drop about ${Math.round(tempDrop)}°F soon.`
    );
} else if (tempDrop >= 5) {
    score += 1;
    forecastNotes.push(
    `Temperature may drop about ${Math.round(tempDrop)}°F over the next few hours.`
    );
}

if (dailyLow <= 45 && feelsLike > 50) {
    score += 1;
    forecastNotes.push(
    `Today's low is ${Math.round(dailyLow)}°F, so it may feel colder later.`
    );
}

return {
    score,
    reasons,
    forecastNotes,
    lowestUpcomingFeelsLike,
    tempDrop,
};
}