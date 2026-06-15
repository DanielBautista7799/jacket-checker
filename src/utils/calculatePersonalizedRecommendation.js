import { calculateJacketScore } from "./calculateJacketScore";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation";
import { calculateProfileModifier } from "./calculateProfileModifier";
import { generateStyleSuggestion } from "./generateStyleSuggestion";
import { rankClosetItems } from "./rankClosetItems";

export function calculatePersonalizedRecommendation({
weather,
profile,
windowId = "rest_of_day",
closetItems = [],
}) {
const baseResult = calculateJacketScore({ weather, windowId });
const profileResult = calculateProfileModifier(profile, weather);

const personalizedScore = baseResult.score + profileResult.modifier;

const mappedRecommendation = mapScoreToRecommendation(
personalizedScore,
weather,
baseResult.forecastAnalysis
);

const closetRanking = rankClosetItems({
closetItems,
weather,
forecastAnalysis: baseResult.forecastAnalysis,
profile,
});

const bestClosetItem = closetRanking.bestItem;

const recommendationBase = {
...mappedRecommendation,
score: personalizedScore,
baseScore: baseResult.score,
profileModifier: profileResult.modifier,
reasons: [...baseResult.reasons, ...profileResult.profileReasons],
forecastAnalysis: baseResult.forecastAnalysis,
profileReasons: profileResult.profileReasons,
closetMatch: closetRanking.bestMatch || null,
weatherNeeds: closetRanking.weatherNeeds,
};

const finalRecommendation = bestClosetItem
? {
    ...recommendationBase,
    primaryItem: bestClosetItem.name,
    jacketType: bestClosetItem.name,
    summary: `Best match from your closet for this forecast.`,
    }
: recommendationBase;

const styleSuggestion = generateStyleSuggestion({
recommendation: finalRecommendation,
weather,
profile,
closetItem: bestClosetItem,
});

return {
...finalRecommendation,
styleSuggestion,
};
}