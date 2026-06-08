import { calculateJacketScore } from "./calculateJacketScore";
import { mapScoreToRecommendation } from "./mapScoreToRecommendation";
import { calculateProfileModifier } from "./calculateProfileModifier";

export function calculatePersonalizedRecommendation({ weather, profile }) {
const baseResult = calculateJacketScore({ weather });
const profileResult = calculateProfileModifier(profile, weather);

const personalizedScore = baseResult.score + profileResult.modifier;

const mappedRecommendation = mapScoreToRecommendation(
personalizedScore,
weather,
baseResult.forecastAnalysis
);

return {
...mappedRecommendation,
score: personalizedScore,
baseScore: baseResult.score,
profileModifier: profileResult.modifier,
reasons: [...baseResult.reasons, ...profileResult.profileReasons],
forecastAnalysis: baseResult.forecastAnalysis,
profileReasons: profileResult.profileReasons,
};
}