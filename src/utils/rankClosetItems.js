function toFiniteNumber(value, fallback) {
if (value === null || value === undefined || value === "") {
    return fallback;
}

const number = Number(value);
return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
return Math.min(maximum, Math.max(minimum, value));
}

function includesAny(value, terms) {
return terms.some((term) => value.includes(term));
}

function getSelectedConditions(weather, forecastAnalysis) {
const selected = forecastAnalysis?.selectedConditions || {};

const feelsLike = toFiniteNumber(
    selected.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
);

return {
    feelsLike,

    lowestFeelsLike: toFiniteNumber(
    selected.lowestFeelsLike,
    toFiniteNumber(
        forecastAnalysis?.lowestWindowFeelsLike,
        feelsLike
    )
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

function getItemPrimaryColor(item) {
return item?.primary_color || item?.color || null;
}

function getItemPreferenceScore(item) {
return toFiniteNumber(
    item?.preference_score ?? item?.times_recommended,
    0
);
}

function isActiveJacket(item) {
return Boolean(
    item &&
    item.category === "jacket" &&
    item.archived !== true
);
}

export function getWeatherNeeds(weather, forecastAnalysis) {
const selectedConditions = getSelectedConditions(
    weather,
    forecastAnalysis
);

const effectiveFeelsLike = Math.min(
    selectedConditions.feelsLike,
    selectedConditions.lowestFeelsLike + 3
);

let warmthNeeded = 1;

if (effectiveFeelsLike < 30) {
    warmthNeeded = 5;
} else if (effectiveFeelsLike < 42) {
    warmthNeeded = 4;
} else if (effectiveFeelsLike < 52) {
    warmthNeeded = 3;
} else if (effectiveFeelsLike < 62) {
    warmthNeeded = 2;
}

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

let rainNeeded = 1;

if (selectedConditions.rainChance >= 70) {
    rainNeeded = 5;
} else if (selectedConditions.rainChance >= 50) {
    rainNeeded = 4;
} else if (selectedConditions.rainChance >= 30) {
    rainNeeded = 3;
}

if (precipitationCondition) {
    rainNeeded = Math.max(rainNeeded, 4);
}

let windNeeded = 1;

if (selectedConditions.windSpeed >= 25) {
    windNeeded = 5;
} else if (selectedConditions.windSpeed >= 20) {
    windNeeded = 4;
} else if (selectedConditions.windSpeed >= 14) {
    windNeeded = 3;
} else if (selectedConditions.windSpeed >= 9) {
    windNeeded = 2;
}

return {
    warmthNeeded,
    rainNeeded,
    windNeeded,
    selectedConditions,
    effectiveFeelsLike,
};
}

function scoreRatingMatch(itemRating, neededRating) {
const rating = toFiniteNumber(itemRating, 1);
const difference = rating - neededRating;

if (difference === 0) {
    return 20;
}

if (difference === 1) {
    return 15;
}

if (difference === -1) {
    return 12;
}

if (difference === 2) {
    return 8;
}

if (difference === -2) {
    return 4;
}

if (difference >= 3) {
    return 2;
}

return -6;
}

function getOverkillPenalty(item, needs) {
let penalty = 0;

const warmthDifference =
    toFiniteNumber(item.warmth_rating, 1) - needs.warmthNeeded;

const rainDifference =
    toFiniteNumber(item.rain_rating, 1) - needs.rainNeeded;

const windDifference =
    toFiniteNumber(item.wind_rating, 1) - needs.windNeeded;

if (warmthDifference >= 3) {
    penalty += 10;
} else if (warmthDifference === 2) {
    penalty += 5;
}

if (needs.rainNeeded <= 2 && rainDifference >= 3) {
    penalty += 3;
}

if (needs.windNeeded <= 2 && windDifference >= 3) {
    penalty += 2;
}

return penalty;
}

function getProtectionDeficitPenalty(item, needs) {
let penalty = 0;

const rainRating = toFiniteNumber(item.rain_rating, 1);
const windRating = toFiniteNumber(item.wind_rating, 1);

if (needs.rainNeeded >= 4) {
    if (rainRating <= 1) {
    penalty += 18;
    } else if (rainRating === 2) {
    penalty += 10;
    }
}

if (needs.windNeeded >= 4) {
    if (windRating <= 1) {
    penalty += 14;
    } else if (windRating === 2) {
    penalty += 8;
    }
}

return penalty;
}

function getProfileStyleScore(item, profile) {
let score = 0;

const profileStyle = profile?.style_preference;
const preferredColor = profile?.preferred_color;
const itemColor = getItemPrimaryColor(item);

if (
    profileStyle &&
    Array.isArray(item.style_tags) &&
    item.style_tags.includes(profileStyle)
) {
    score += 12;
}

if (preferredColor && itemColor === preferredColor) {
    score += 8;
}

return score;
}

function getLearnedAttributeScore(item, preferenceModel) {
if (!preferenceModel) {
    return 0;
}

let rawScore = 0;
const itemColor = getItemPrimaryColor(item);

rawScore += preferenceModel.colors?.[itemColor] || 0;

if (Array.isArray(item.style_tags)) {
    item.style_tags.forEach((tag) => {
    rawScore += preferenceModel.styleTags?.[tag] || 0;
    });
}

return clamp(Math.round(rawScore * 0.1), -3, 3);
}

function hashString(value) {
let hash = 2166136261;

for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
}

return hash >>> 0;
}

function getTieBreakValue(item, weather, forecastAnalysis) {
const date = String(weather?.localTime || "").split(" ")[0];

const seed = [
    weather?.city || "unknown",
    forecastAnalysis?.windowId || "rest_of_day",
    date || "unknown-date",
    item.id || item.name || "item",
].join("|");

return hashString(seed);
}

function getProtectionReason(label, itemRating, neededRating) {
const rating = toFiniteNumber(itemRating, 1);
const difference = rating - neededRating;
const lowerLabel = label.toLowerCase();

if (difference === 0 || difference === 1) {
    return `Its ${lowerLabel} is a strong match for this forecast.`;
}

if (difference < 0) {
    return `Its ${lowerLabel} may be lighter than ideal for this forecast.`;
}

return `Its ${lowerLabel} provides more protection than the forecast requires.`;
}

function buildReasons({
item,
weatherNeeds,
profileStyleScore,
preferenceScore,
learnedAttributeScore,
overkillPenalty,
protectionDeficitPenalty,
}) {
const reasons = [
    getProtectionReason(
    "warmth",
    item.warmth_rating,
    weatherNeeds.warmthNeeded
    ),
];

if (weatherNeeds.rainNeeded >= 3) {
    reasons.push(
    getProtectionReason(
        "rain protection",
        item.rain_rating,
        weatherNeeds.rainNeeded
    )
    );
}

if (weatherNeeds.windNeeded >= 3) {
    reasons.push(
    getProtectionReason(
        "wind protection",
        item.wind_rating,
        weatherNeeds.windNeeded
    )
    );
}

if (profileStyleScore > 0) {
    reasons.push("It matches your saved style preferences.");
}

if (preferenceScore > 0 || learnedAttributeScore > 0) {
    reasons.push("Your past feedback favors this jacket.");
}

if (preferenceScore < 0 || learnedAttributeScore < 0) {
    reasons.push("Your past feedback lowers this match.");
}

if (overkillPenalty > 0) {
    reasons.push(
    "It may offer more protection than this forecast needs."
    );
}

if (protectionDeficitPenalty > 0) {
    reasons.push(
    "Its weather protection is weaker than the selected forecast calls for."
    );
}

return reasons;
}

export function rankClosetItems({
closetItems = [],
weather,
forecastAnalysis,
profile,
preferenceModel = null,
excludedItemIds = [],
}) {
const weatherNeeds = getWeatherNeeds(
    weather,
    forecastAnalysis
);

const excludedSet = new Set(excludedItemIds);

const rankedItems = closetItems
    .filter(
    (item) =>
        isActiveJacket(item) &&
        !excludedSet.has(item.id)
    )
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

    const profileStyleScore = getProfileStyleScore(
        item,
        profile
    );

    const preferenceScore = getItemPreferenceScore(item);

    const learnedAttributeScore = getLearnedAttributeScore(
        item,
        preferenceModel
    );

    const overkillPenalty = getOverkillPenalty(
        item,
        weatherNeeds
    );

    const protectionDeficitPenalty =
        getProtectionDeficitPenalty(item, weatherNeeds);

    const score =
        warmthScore +
        rainScore +
        windScore +
        profileStyleScore +
        preferenceScore +
        learnedAttributeScore -
        overkillPenalty -
        protectionDeficitPenalty;

    return {
        item,
        score,
        warmthScore,
        rainScore,
        windScore,
        profileStyleScore,
        preferenceScore,
        learnedAttributeScore,
        overkillPenalty,
        protectionDeficitPenalty,
        tieBreakValue: getTieBreakValue(
        item,
        weather,
        forecastAnalysis
        ),
        reasons: buildReasons({
        item,
        weatherNeeds,
        profileStyleScore,
        preferenceScore,
        learnedAttributeScore,
        overkillPenalty,
        protectionDeficitPenalty,
        }),
    };
    })
    .sort((first, second) => {
    if (second.score !== first.score) {
        return second.score - first.score;
    }

    if (second.tieBreakValue !== first.tieBreakValue) {
        return second.tieBreakValue - first.tieBreakValue;
    }

    return String(first.item.name || "").localeCompare(
        String(second.item.name || "")
    );
    });

return {
    bestItem: rankedItems[0]?.item || null,
    bestMatch: rankedItems[0] || null,
    topMatches: rankedItems.slice(0, 3),
    rankedItems,
    weatherNeeds,
};
}