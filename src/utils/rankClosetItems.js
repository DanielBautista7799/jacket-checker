export function getWeatherNeeds(
weather,
forecastAnalysis
) {
const feelsLike =
    weather?.feelsLike ?? 65;

const rainChance =
    forecastAnalysis?.highestWindowRainChance ??
    weather?.rainChance ??
    0;

const windSpeed =
    forecastAnalysis?.highestWindowWind ??
    weather?.windSpeed ??
    0;

let warmthNeeded = 1;

if (feelsLike < 30) {
    warmthNeeded = 5;
} else if (feelsLike < 40) {
    warmthNeeded = 4;
} else if (feelsLike < 50) {
    warmthNeeded = 3;
} else if (feelsLike < 60) {
    warmthNeeded = 2;
}

let rainNeeded = 1;

if (rainChance >= 70) {
    rainNeeded = 5;
} else if (rainChance >= 50) {
    rainNeeded = 4;
} else if (rainChance >= 30) {
    rainNeeded = 3;
}

let windNeeded = 1;

if (windSpeed >= 25) {
    windNeeded = 5;
} else if (windSpeed >= 20) {
    windNeeded = 4;
} else if (windSpeed >= 14) {
    windNeeded = 3;
} else if (windSpeed >= 9) {
    windNeeded = 2;
}

return {
    warmthNeeded,
    rainNeeded,
    windNeeded,
};
}

function scoreRatingMatch(
itemRating,
neededRating
) {
const rating = Number(itemRating) || 1;

const difference = Math.abs(
    rating - neededRating
);

if (difference === 0) {
    return 20;
}

if (difference === 1) {
    return 14;
}

if (difference === 2) {
    return 7;
}

return 2;
}

function getOverkillPenalty(
item,
needs
) {
let penalty = 0;

if (
    Number(item.warmth_rating) -
    needs.warmthNeeded >=
    3
) {
    penalty += 8;
}

if (
    Number(item.rain_rating) -
    needs.rainNeeded >=
    3
) {
    penalty += 3;
}

return penalty;
}

function getProfileStyleScore(
item,
profile
) {
let score = 0;

const profileStyle =
    profile?.style_preference;

const preferredColor =
    profile?.preferred_color;

if (
    profileStyle &&
    item.style_tags?.includes(profileStyle)
) {
    score += 15;
}

if (
    preferredColor &&
    item.color === preferredColor
) {
    score += 10;
}

return score;
}

export function rankClosetItems({
closetItems = [],
weather,
forecastAnalysis,
profile,
excludedItemIds = [],
}) {
const weatherNeeds = getWeatherNeeds(
    weather,
    forecastAnalysis
);

const excludedSet = new Set(
    excludedItemIds
);

const rankedItems = closetItems
    .filter(
    (item) => !excludedSet.has(item.id)
    )
    .map((item) => {
    const warmthScore =
        scoreRatingMatch(
        item.warmth_rating,
        weatherNeeds.warmthNeeded
        );

    const rainScore =
        scoreRatingMatch(
        item.rain_rating,
        weatherNeeds.rainNeeded
        );

    const windScore =
        scoreRatingMatch(
        item.wind_rating,
        weatherNeeds.windNeeded
        );

    const profileStyleScore =
        getProfileStyleScore(
        item,
        profile
        );

    const preferenceScore = Number(
        item.times_recommended || 0
    );

    const overkillPenalty =
        getOverkillPenalty(
        item,
        weatherNeeds
        );

    const score =
        warmthScore +
        rainScore +
        windScore +
        profileStyleScore +
        preferenceScore -
        overkillPenalty;

    const reasons = [
        `Warmth ${item.warmth_rating}/5 vs needed ${weatherNeeds.warmthNeeded}/5`,
        `Rain ${item.rain_rating}/5 vs needed ${weatherNeeds.rainNeeded}/5`,
        `Wind ${item.wind_rating}/5 vs needed ${weatherNeeds.windNeeded}/5`,
    ];

    if (profileStyleScore > 0) {
        reasons.push(
        "Matches your saved style profile."
        );
    }

    if (preferenceScore > 0) {
        reasons.push(
        `Preference score: +${preferenceScore}.`
        );
    }

    if (preferenceScore < 0) {
        reasons.push(
        `Preference score: ${preferenceScore}.`
        );
    }

    if (overkillPenalty > 0) {
        reasons.push(
        "Penalized for being more protection than the forecast needs."
        );
    }

    return {
        item,
        score,
        warmthScore,
        rainScore,
        windScore,
        profileStyleScore,
        preferenceScore,
        overkillPenalty,
        reasons,
    };
    })
    .sort((first, second) => {
    if (second.score !== first.score) {
        return second.score - first.score;
    }

    return (
        Number(
        second.item.times_recommended || 0
        ) -
        Number(
        first.item.times_recommended || 0
        )
    );
    });

return {
    bestItem:
    rankedItems[0]?.item || null,

    bestMatch:
    rankedItems[0] || null,

    topMatches:
    rankedItems.slice(0, 3),

    rankedItems,
    weatherNeeds,
};
}