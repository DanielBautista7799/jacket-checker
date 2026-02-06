//current outline of returned score recommendation
export function mapScoreToRecommendation(score) {
    if (score <= 1) return "No jacket needed";
    if (score <= 3) return "Light jacket or hoodie";
    if (score <= 6) return "Insulated jacket recommended";
    if (score <= 8) return "Heavy coat suggested";
    return "Bundle up with winter gear";
}