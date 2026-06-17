import { calculateJacketScore } from "./calculateJacketScore";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation";
import { calculateProfileModifier } from "./calculateProfileModifier";
import { generateStyleSuggestion } from "./generateStyleSuggestion";
import { rankClosetItems } from "./rankClosetItems";

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

const recommendation = {
...recommendationBase,
primaryItem: closetItem.name,
jacketType: closetItem.type,
summary:
    "This is the best match from your closet for the selected forecast.",
closetMatch,
rankedClosetMatches,
weatherNeeds,
};

const styleSuggestion = generateStyleSuggestion({
recommendation,
weather,
profile,
closetItem,
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
weather
);

const personalizedScore =
baseResult.score + profileResult.modifier;

const mappedRecommendation =
mapScoreToRecommendation(
    personalizedScore,
    weather,
    baseResult.forecastAnalysis
);

const recommendationBase = {
...mappedRecommendation,
score: personalizedScore,
baseScore: baseResult.score,
profileModifier: profileResult.modifier,
reasons: [
    ...baseResult.reasons,
    ...profileResult.profileReasons,
],
forecastAnalysis:
    baseResult.forecastAnalysis,
profileReasons:
    profileResult.profileReasons,
};

if (mappedRecommendation.decision !== "YES") {
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
forecastAnalysis:
    baseResult.forecastAnalysis,
profile,
preferenceModel,
});

return buildRecommendationForClosetMatch({
recommendationBase: {
    ...recommendationBase,
    weatherNeeds: closetRanking.weatherNeeds,
    rankedClosetMatches:
    closetRanking.topMatches,
    allRankedClosetMatches:
    closetRanking.rankedItems,
},
closetMatch: closetRanking.bestMatch,
weather,
profile,
rankedClosetMatches:
    closetRanking.topMatches,
weatherNeeds: closetRanking.weatherNeeds,
});
}