function clamp(value, min, max) {
return Math.min(Math.max(value, min), max);
}

export function getWeatherNeeds(weather, forecastAnalysis) {
const feelsLike = weather?.feelsLike ?? 65;
const rainChance =
    forecastAnalysis?.highestWindowRainChance ?? weather?.rainChance ?? 0;
const windSpeed =
    forecastAnalysis?.highestWindowWind ?? weather?.windSpeed ?? 0;

let warmthNeeded = 1;

if (feelsLike < 30) warmthNeeded = 5;
else if (feelsLike < 40) warmthNeeded = 4;
else if (feelsLike < 50) warmthNeeded = 3;
else if (feelsLike < 60) warmthNeeded = 2;

let rainNeeded = 1;

if (rainChance >= 70) rainNeeded = 5;
else if (rainChance >= 50) rainNeeded = 4;
else if (rainChance >= 30) rainNeeded = 3;

let windNeeded = 1;

if (windSpeed >= 25) windNeeded = 5;
else if (windSpeed >= 20) windNeeded = 4;
else if (windSpeed >= 14) windNeeded = 3;
else if (windSpeed >= 9) windNeeded = 2;

return {
    warmthNeeded,
    rainNeeded,
    windNeeded,
};
}

function scoreRatingMatch(itemRating, neededRating) {
const difference = Math.abs(itemRating - neededRating);

if (difference === 0) return 20;
if (difference === 1) return 14;
if (difference === 2) return 7;

return 2;
}

function getOverkillPenalty(item, needs) {
let penalty = 0;

if (item.warmth_rating - needs.warmthNeeded >= 3) {
    penalty += 8;
}

if (item.rain_rating - needs.rainNeeded >= 3) {
    penalty += 3;
}

return penalty;
}

function getStyleScore(item, profile) {
const stylePreference = profile?.style_preference;
const preferredColor = profile?.preferred_color;

let score = 0;

if (stylePreference && item.style_tags?.includes(stylePreference)) {
    score += 15;
}

if (preferredColor && item.color === preferredColor) {
    score += 10;
}

if (item.times_recommended > 0) {
    score += clamp(item.times_recommended, 0, 5);
}

return score;
}

export function rankClosetItems({
closetItems = [],
weather,
forecastAnalysis,
profile,
}) {
if (!closetItems.length) {
    return {
    bestItem: null,
    rankedItems: [],
    weatherNeeds: getWeatherNeeds(weather, forecastAnalysis),
    };
}

const weatherNeeds = getWeatherNeeds(weather, forecastAnalysis);

const rankedItems = closetItems
    .map((item) => {
    const warmthScore = scoreRatingMatch(
        item.warmth_rating,
        weatherNeeds.warmthNeeded
    );

    const rainScore = scoreRatingMatch(
        item.rain_rating,
        weatherNeeds.rainNeeded
    );

    const windScore = scoreRatingMatch(
        item.wind_rating,
        weatherNeeds.windNeeded
    );

    const styleScore = getStyleScore(item, profile);
    const overkillPenalty = getOverkillPenalty(item, weatherNeeds);

    const score =
        warmthScore +
        rainScore +
        windScore +
        styleScore -
        overkillPenalty;

    const reasons = [
        `Warmth ${item.warmth_rating}/5 vs needed ${weatherNeeds.warmthNeeded}/5`,
        `Rain ${item.rain_rating}/5 vs needed ${weatherNeeds.rainNeeded}/5`,
        `Wind ${item.wind_rating}/5 vs needed ${weatherNeeds.windNeeded}/5`,
    ];

    if (styleScore > 0) {
        reasons.push("Matches your saved style preferences.");
    }

    if (overkillPenalty > 0) {
        reasons.push("Slightly penalized for being more than needed.");
    }

    return {
        item,
        score,
        reasons,
    };
    })
    .sort((a, b) => b.score - a.score);

return {
    bestItem: rankedItems[0]?.item || null,
    bestMatch: rankedItems[0] || null,
    rankedItems,
    weatherNeeds,
};
}