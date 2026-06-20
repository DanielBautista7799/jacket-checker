function toFiniteNumber(value, fallback) {
if (value === null || value === undefined || value === "") {
    return fallback;
}

const number = Number(value);
return Number.isFinite(number) ? number : fallback;
}

export function calculateProfileModifier(
profile,
weather,
forecastAnalysis = null
) {
let modifier = 0;
const profileReasons = [];

if (!profile) {
    return {
    modifier,
    profileReasons,
    };
}

const selectedConditions =
    forecastAnalysis?.selectedConditions || {};

const feelsLike = toFiniteNumber(
    selectedConditions.feelsLike,
    toFiniteNumber(weather?.feelsLike, 65)
);

const rainChance = toFiniteNumber(
    selectedConditions.rainChance,
    toFiniteNumber(weather?.rainChance, 0)
);

const windSpeed = toFiniteNumber(
    selectedConditions.windSpeed,
    toFiniteNumber(weather?.windSpeed, 0)
);

if (profile.cold_tolerance === "cold") {
    modifier += 3;
    profileReasons.push("Your profile says you run cold.");
}

if (profile.cold_tolerance === "hot") {
    modifier -= 3;
    profileReasons.push("Your profile says you run hot.");
}

if (
    profile.rain_sensitivity === "high" &&
    rainChance >= 30
) {
    modifier += 1;
    profileReasons.push(
    "Your profile says rain affects your comfort more than average."
    );
}

if (
    profile.rain_sensitivity === "low" &&
    rainChance >= 30
) {
    modifier -= 1;
    profileReasons.push(
    "Your profile says rain bothers you less than average."
    );
}

if (
    profile.wind_sensitivity === "high" &&
    windSpeed >= 12
) {
    modifier += 1;
    profileReasons.push(
    "Your profile says wind affects your comfort more than average."
    );
}

if (
    profile.wind_sensitivity === "low" &&
    windSpeed >= 12
) {
    modifier -= 1;
    profileReasons.push(
    "Your profile says wind bothers you less than average."
    );
}

if (
    profile.default_exposure === "long" &&
    feelsLike < 70
) {
    modifier += 2;
    profileReasons.push(
    "Your usual time outside is long, so sustained conditions matter more."
    );
}

if (
    profile.default_exposure === "medium" &&
    feelsLike < 60
) {
    modifier += 1;
    profileReasons.push(
    "Your usual time outside is long enough for cooler conditions to matter."
    );
}

if (
    profile.default_exposure === "short" &&
    feelsLike > 45
) {
    modifier -= 1;
    profileReasons.push(
    "Your usual time outside is short, so milder conditions are easier to handle."
    );
}

if (
    profile.age &&
    profile.age >= 55 &&
    feelsLike < 55
) {
    modifier += 1;
    profileReasons.push(
    "Your age range adds a small warmth buffer in cooler weather."
    );
}

return {
    modifier,
    profileReasons,
    selectedConditions,
};
}