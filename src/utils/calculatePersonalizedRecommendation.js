import { calculateJacketScore } from "./calculateJacketScore";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation";
import { calculateProfileModifier } from "./calculateProfileModifier";
import { generateStyleSuggestion } from "./generateStyleSuggestion";
import { rankClosetItems } from "./rankClosetItems";

const REQUIRED_RAIN_CHANCE = 60;
const REQUIRED_WIND_SPEED = 22;

function toFiniteNumber(value, fallback) {
if (value === null || value === undefined || value === "") {
return fallback;
}

const number = Number(value);
return Number.isFinite(number) ? number : fallback;
}

function getSelectedConditions(weather, forecastAnalysis) {
const selected = forecastAnalysis?.selectedConditions || {};

return {
feelsLike: toFiniteNumber(
    selected.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
),

rainChance: toFiniteNumber(
    selected.rainChance,
    toFiniteNumber(
    forecastAnalysis?.highestWindowRainChance,
    toFiniteNumber(weather?.rainChance, 0)
    )
),

windSpeed: toFiniteNumber(
    selected.windSpeed,
    toFiniteNumber(
    forecastAnalysis?.highestWindowWind,
    toFiniteNumber(weather?.windSpeed, 0)
    )
),

condition: String(
    selected.condition || weather?.condition || ""
).toLowerCase(),
};
}

function includesAny(value, terms) {
return terms.some((term) => value.includes(term));
}

function getProtectionOverride({
mappedRecommendation,
weather,
forecastAnalysis,
}) {
if (mappedRecommendation?.decision === "YES") {
return {
    recommendation: mappedRecommendation,
    reason: null,
};
}

const selectedConditions = getSelectedConditions(
weather,
forecastAnalysis
);

const precipitationCondition = includesAny(
selectedConditions.condition,
[
    "rain",
    "drizzle",
    "shower",
    "thunderstorm",
    "storm",
    "sleet",
    "snow",
    "freezing",
    "ice",
]
);

const winterPrecipitation = includesAny(
selectedConditions.condition,
["sleet", "snow", "freezing", "ice"]
);

const rainProtectionRequired =
selectedConditions.rainChance >= REQUIRED_RAIN_CHANCE ||
(precipitationCondition && selectedConditions.rainChance >= 40) ||
winterPrecipitation;

const windProtectionRequired =
selectedConditions.windSpeed >= REQUIRED_WIND_SPEED;

if (!rainProtectionRequired && !windProtectionRequired) {
return {
    recommendation: mappedRecommendation,
    reason: null,
};
}

const warmWindow = selectedConditions.feelsLike >= 65;

if (rainProtectionRequired && windProtectionRequired) {
const primaryItem = warmWindow
    ? "Light weather shell"
    : "Water-resistant windbreaker";

return {
    recommendation: {
    ...mappedRecommendation,
    decision: "YES",
    jacketType: primaryItem,
    primaryItem,
    summary: warmWindow
        ? "Wear or bring a light weather shell. You do not need extra warmth, but the selected window has both high rain risk and strong wind."
        : "Wear a water-resistant windbreaker for the wet and windy selected window.",
    optionalLayer: null,
    recommendationBasis: "rain_wind_protection",
    },
    reason: `Rain risk may reach ${Math.round(
    selectedConditions.rainChance
    )}% and wind may reach ${Math.round(
    selectedConditions.windSpeed
    )} mph, so protective outerwear is recommended even without a warmth need.`,
};
}

if (rainProtectionRequired) {
const primaryItem = winterPrecipitation
    ? "Weather-protective jacket"
    : warmWindow
    ? "Light rain shell"
    : "Water-resistant jacket";

return {
    recommendation: {
    ...mappedRecommendation,
    decision: "YES",
    jacketType: primaryItem,
    primaryItem,
    summary: winterPrecipitation
        ? "Wear a weather-protective jacket because wintry precipitation is part of the selected forecast."
        : warmWindow
        ? "Wear or bring a light rain shell. It is recommended for rain protection, not extra warmth."
        : "Wear a water-resistant jacket because rain is likely during the selected window.",
    optionalLayer: null,
    recommendationBasis: "rain_protection",
    },
    reason: `Rain risk may reach ${Math.round(
    selectedConditions.rainChance
    )}%, so a rain-protective jacket is recommended even if the selected window is warm.`,
};
}

const primaryItem = warmWindow
? "Light windbreaker"
: "Wind-resistant jacket";

return {
recommendation: {
    ...mappedRecommendation,
    decision: "YES",
    jacketType: primaryItem,
    primaryItem,
    summary: warmWindow
    ? "Wear or bring a light windbreaker. It is recommended for wind protection, not extra warmth."
    : "Wear a wind-resistant jacket because strong wind is expected during the selected window.",
    optionalLayer: null,
    recommendationBasis: "wind_protection",
},
reason: `Wind may reach ${Math.round(
    selectedConditions.windSpeed
)} mph, so wind-resistant outerwear is recommended even without a warmth need.`,
};
}

function getOwnedMatchSummary(recommendationBase, closetItem) {
const basis = recommendationBase?.recommendationBasis;
const feelsLike = toFiniteNumber(
recommendationBase?.selectedConditions?.feelsLike,
65
);
const warmWindow = feelsLike >= 65;

if (basis === "rain_wind_protection") {
return warmWindow
    ? `${closetItem.name} is your best owned option for the high rain risk and strong wind. Keep the layers underneath light because the selected window is warm.`
    : `${closetItem.name} is your best owned option for the wet and windy selected window.`;
}

if (basis === "rain_protection") {
return warmWindow
    ? `${closetItem.name} is your best owned option for rain protection. It is being recommended for the weather, not extra warmth.`
    : `${closetItem.name} is your best owned option for the likely rain and cooler conditions.`;
}

if (basis === "wind_protection") {
return warmWindow
    ? `${closetItem.name} is your best owned option for wind protection. It is being recommended for the weather, not extra warmth.`
    : `${closetItem.name} is your best owned option for the strong wind and cooler conditions.`;
}

return "This owned jacket matches the selected forecast and your saved preferences.";
}

export function buildRecommendationForClosetMatch({
recommendationBase,
closetMatch,
weather,
profile,
rankedClosetMatches = [],
weatherNeeds = null,
}) {
if (
recommendationBase?.decision !== "YES" ||
!closetMatch?.item
) {
return {
    ...recommendationBase,
    closetMatch: null,
    rankedClosetMatches: [],
    allRankedClosetMatches: [],
    weatherNeeds,
    styleSuggestion: null,
};
}

const closetItem = closetMatch.item;
const itemSubtype =
closetItem.subtype ||
closetItem.type ||
recommendationBase.jacketType ||
"jacket";

const recommendation = {
...recommendationBase,
primaryItem: closetItem.name,
jacketType: itemSubtype,
summary: getOwnedMatchSummary(
    recommendationBase,
    closetItem
),
closetMatch,
rankedClosetMatches,
weatherNeeds,
};

const styleSuggestion = generateStyleSuggestion({
recommendation,
weather,
profile,
closetItem,
forecastAnalysis: recommendationBase.forecastAnalysis,
});

return {
...recommendation,
styleSuggestion,
};
}

export function calculatePersonalizedRecommendation({
weather,
profile,
windowId = "rest_of_day",
closetItems = [],
preferenceModel = null,
}) {
const baseResult = calculateJacketScore({
weather,
windowId,
});

const profileResult = calculateProfileModifier(
profile,
weather,
baseResult.forecastAnalysis
);

const personalizedScore =
baseResult.score + profileResult.modifier;

const mappedRecommendation = mapScoreToRecommendation(
personalizedScore,
weather,
baseResult.forecastAnalysis
);

const protectionResult = getProtectionOverride({
mappedRecommendation,
weather,
forecastAnalysis: baseResult.forecastAnalysis,
});

const effectiveRecommendation =
protectionResult.recommendation;

const recommendationBase = {
...effectiveRecommendation,
score: personalizedScore,
baseScore: baseResult.score,
profileModifier: profileResult.modifier,
reasons: [
    ...baseResult.reasons,
    ...profileResult.profileReasons,
    ...(protectionResult.reason
    ? [protectionResult.reason]
    : []),
],
forecastAnalysis: baseResult.forecastAnalysis,
selectedConditions: baseResult.selectedConditions,
confidence: baseResult.confidence,
profileReasons: profileResult.profileReasons,
};

if (effectiveRecommendation.decision !== "YES") {
return {
    ...recommendationBase,
    closetMatch: null,
    rankedClosetMatches: [],
    allRankedClosetMatches: [],
    weatherNeeds: null,
    styleSuggestion: null,
};
}

const closetRanking = rankClosetItems({
closetItems,
weather,
forecastAnalysis: baseResult.forecastAnalysis,
profile,
preferenceModel,
});

return buildRecommendationForClosetMatch({
recommendationBase: {
    ...recommendationBase,
    weatherNeeds: closetRanking.weatherNeeds,
    rankedClosetMatches: closetRanking.topMatches,
    allRankedClosetMatches: closetRanking.rankedItems,
},
closetMatch: closetRanking.bestMatch,
weather,
profile,
rankedClosetMatches: closetRanking.topMatches,
weatherNeeds: closetRanking.weatherNeeds,
});
}