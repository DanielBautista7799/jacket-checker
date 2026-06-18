import { useContext } from "react";

import {
RecommendationLearningContext,
} from "../context/RecommendationLearningContext";

function useRecommendationLearning() {
const context = useContext(
RecommendationLearningContext
);

if (!context) {
throw new Error(
    "useRecommendationLearning must be used inside a RecommendationLearningProvider."
);
}

return context;
}

export default useRecommendationLearning;