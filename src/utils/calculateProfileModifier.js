export function calculateProfileModifier(profile, weather) {
let modifier = 0;
const profileReasons = [];

if (!profile) {
    return {
    modifier,
    profileReasons,
    };
}

const feelsLike = weather.feelsLike;
const rainChance = weather.rainChance;
const windSpeed = weather.windSpeed;
const maxWind = weather.maxWind;

// Cold tolerance is the strongest personal factor.
if (profile.cold_tolerance === "cold") {
    modifier += 3;
    profileReasons.push("Your profile says you run cold.");
}

if (profile.cold_tolerance === "hot") {
    modifier -= 3;
    profileReasons.push("Your profile says you run hot.");
}

// Rain sensitivity matters only when rain is relevant.
if (profile.rain_sensitivity === "high" && rainChance >= 30) {
    modifier += 1;
    profileReasons.push("Your profile says rain affects your comfort more than average.");
}

if (profile.rain_sensitivity === "low" && rainChance >= 30) {
    modifier -= 1;
    profileReasons.push("Your profile says rain bothers you less than average.");
}

// Wind sensitivity matters only when wind is relevant.
if (
    profile.wind_sensitivity === "high" &&
    (windSpeed >= 10 || maxWind >= 16)
) {
    modifier += 1;
    profileReasons.push("Your profile says wind affects your comfort more than average.");
}

if (
    profile.wind_sensitivity === "low" &&
    (windSpeed >= 10 || maxWind >= 16)
) {
    modifier -= 1;
    profileReasons.push("Your profile says wind bothers you less than average.");
}

// Exposure estimates how long the user usually stays outside.
if (profile.default_exposure === "long" && feelsLike < 70) {
    modifier += 2;
    profileReasons.push("Your default exposure is long, so later conditions matter more.");
}

if (profile.default_exposure === "medium" && feelsLike < 60) {
    modifier += 1;
    profileReasons.push("Your default exposure is medium, so a layer may be useful.");
}

if (profile.default_exposure === "short" && feelsLike > 45) {
    modifier -= 1;
    profileReasons.push("Your default exposure is short, so you can tolerate milder conditions.");
}

// Age is kept light
if (profile.age && profile.age >= 55 && feelsLike < 55) {
    modifier += 1;
    profileReasons.push("Your age range adds a small warmth buffer in cooler weather.");
}

// Height, weight, and sex are stored for future styling and fit logic.
// They are intentionally not major drivers in this weather-only version.

return {
    modifier,
    profileReasons,
};
}