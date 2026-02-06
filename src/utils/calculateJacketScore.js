export function calculateJacketScore({
    feelsLike,
    windSpeed,
    rainChance,
    duration,
    tolerance,
    activity,
}) {
    let score = 0;

    // Temperature factor
    if (feelsLike < 40) score += 4;
    else if (feelsLike < 50) score += 3;
    else if (feelsLike < 60) score += 2;
    else if (feelsLike < 65) score += 1;

    // Wind factor
    if (windSpeed > 15) score += 2;
    else if (windSpeed > 8) score += 1;

    // Rain factor
    if (rainChance > 60) score += 2;
    else if (rainChance > 30) score += 1;

    // Duration factor
    if (duration === "medium") score += 1;
    if (duration === "long") score += 2;

    // Personal tolerance
    if (tolerance === "cold") score += 2;
    if (tolerance === "hot") score -= 2;

    // Activity level (movement warms you up)
    if (activity === "walk") score -= 1;
    if (activity === "active") score -= 2;

    return score;
}
