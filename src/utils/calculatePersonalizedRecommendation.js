import { calculateJacketScore } from "./calculateJacketScore";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation";
import { calculateProfileModifier } from "./calculateProfileModifier";
import { generateStyleSuggestion } from "./generateStyleSuggestion";

export function calculatePersonalizedRecommendation({
weather,
profile,
windowId = "rest_of_day",
}) {
const baseResult = calculateJacketScore({ weather, windowId });
const profileResult = calculateProfileModifier(profile, weather);

const personalizedScore = baseResult.score + profileResult.modifier;

const mappedRecommendation = mapScoreToRecommendation(
personalizedScore,
weather,
baseResult.forecastAnalysis
);

const recommendationBase = {
...mappedRecommendation,
score: personalizedScore,
baseScore: baseResult.score,
profileModifier: profileResult.modifier,
reasons: [...baseResult.reasons, ...profileResult.profileReasons],
forecastAnalysis: baseResult.forecastAnalysis,
profileReasons: profileResult.profileReasons,
};

const styleSuggestion = generateStyleSuggestion({
recommendation: recommendationBase,
weather,
profile,
});

return {
...recommendationBase,
styleSuggestion,
};
}