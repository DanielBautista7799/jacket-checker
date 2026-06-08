export function analyzeForecast(weather) {
const alerts = [];
const bringAlongSuggestions = [];

const {
    feelsLike,
    dailyLow,
    rainChance,
    maxWind,
    upcomingHours = [],
} = weather;

const lowestUpcomingFeelsLike =
    upcomingHours.length > 0
    ? Math.min(...upcomingHours.map((hour) => hour.feelsLike))
    : feelsLike;

const highestUpcomingRainChance =
    upcomingHours.length > 0
    ? Math.max(...upcomingHours.map((hour) => hour.rainChance))
    : rainChance;

const tempDrop = feelsLike - lowestUpcomingFeelsLike;

// Rain analysis
if (highestUpcomingRainChance >= 60 || rainChance >= 60) {
    alerts.push({
    type: "rain",
    message: `Rain is likely later with up to ${Math.round(
        highestUpcomingRainChance
    )}% chance.`,
    });

    bringAlongSuggestions.push({
    item: "Rain jacket",
    reason: "Rain is likely later, so water resistance matters.",
    });
} else if (highestUpcomingRainChance >= 35 || rainChance >= 35) {
    alerts.push({
    type: "rain",
    message: `There is some rain risk later with up to ${Math.round(
        highestUpcomingRainChance
    )}% chance.`,
    });

    bringAlongSuggestions.push({
    item: "Light rain shell",
    reason: "Rain is possible, but not guaranteed.",
    });
}

// Temperature drop analysis
if (tempDrop >= 12) {
    alerts.push({
    type: "temperature-drop",
    message: `Temperatures are projected to drop about ${Math.round(
        tempDrop
    )}°F over the next few hours.`,
    });

    bringAlongSuggestions.push({
    item: "Light jacket",
    reason: "It may feel noticeably colder later.",
    });
} else if (tempDrop >= 7) {
    alerts.push({
    type: "temperature-drop",
    message: `It may cool down about ${Math.round(
        tempDrop
    )}°F later today.`,
    });

    bringAlongSuggestions.push({
    item: "Light layer",
    reason: "A small layer could help if you are out later.",
    });
}

// Daily low analysis
if (dailyLow <= 45 && feelsLike > 50) {
    alerts.push({
    type: "daily-low",
    message: `Today's low is ${Math.round(
        dailyLow
    )}°F, so it may get chilly later.`,
    });

    bringAlongSuggestions.push({
    item: "Light jacket",
    reason: "The low temperature is jacket-worthy later in the day.",
    });
}

// Wind analysis
if (maxWind >= 22) {
    alerts.push({
    type: "wind",
    message: `Strong winds may reach ${Math.round(maxWind)} mph today.`,
    });

    bringAlongSuggestions.push({
    item: "Windbreaker",
    reason: "Wind can make mild temperatures feel colder.",
    });
} else if (maxWind >= 16) {
    alerts.push({
    type: "wind",
    message: `Breezy conditions may reach ${Math.round(maxWind)} mph today.`,
    });

    bringAlongSuggestions.push({
    item: "Light windbreaker",
    reason: "A wind-resistant layer could help.",
    });
}

// Remove duplicate bring-along items
const uniqueBringAlongSuggestions = bringAlongSuggestions.filter(
    (suggestion, index, self) =>
    index === self.findIndex((item) => item.item === suggestion.item)
);

return {
    alerts,
bringAlongSuggestions: uniqueBringAlongSuggestions,
    lowestUpcomingFeelsLike,
    highestUpcomingRainChance,
    tempDrop,
};
}