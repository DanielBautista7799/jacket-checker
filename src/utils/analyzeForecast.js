import { getForecastWindowHours, getTimeWindowLabel } from "./timeWindows";

export function analyzeForecast(weather, windowId = "rest_of_day") {
const alerts = [];
const bringAlongSuggestions = [];

const windowHours = getForecastWindowHours(weather, windowId);
const windowLabel = getTimeWindowLabel(windowId);

const {
feelsLike,
dailyLow,
rainChance,
maxWind,
windSpeed,
} = weather;

const lowestWindowFeelsLike =
windowHours.length > 0
    ? Math.min(...windowHours.map((hour) => hour.feelsLike))
    : feelsLike;

const highestWindowFeelsLike =
windowHours.length > 0
    ? Math.max(...windowHours.map((hour) => hour.feelsLike))
    : feelsLike;

const highestWindowRainChance =
windowHours.length > 0
    ? Math.max(...windowHours.map((hour) => hour.rainChance))
    : rainChance;

const highestWindowWind =
windowHours.length > 0
    ? Math.max(...windowHours.map((hour) => hour.windSpeed))
    : maxWind || windSpeed;

const tempDrop = feelsLike - lowestWindowFeelsLike;

if (windowId !== "now") {
if (highestWindowRainChance >= 60 || rainChance >= 60) {
    alerts.push({
    type: "rain",
    message: `Rain is likely during ${windowLabel.toLowerCase()} with up to ${Math.round(
        highestWindowRainChance
    )}% chance.`,
    });

    bringAlongSuggestions.push({
    item: "Rain jacket or waterproof shell",
    reason: "Rain is likely, so water resistance matters more than warmth.",
    });
} else if (highestWindowRainChance >= 35 || rainChance >= 35) {
    alerts.push({
    type: "rain",
    message: `There is some rain risk during ${windowLabel.toLowerCase()} with up to ${Math.round(
        highestWindowRainChance
    )}% chance.`,
    });

    bringAlongSuggestions.push({
    item: "Light rain shell",
    reason: "Rain is possible, so a packable layer is safer.",
    });
}

if (tempDrop >= 12) {
    alerts.push({
    type: "temperature-drop",
    message: `It may feel about ${Math.round(
        tempDrop
    )}°F colder during ${windowLabel.toLowerCase()}.`,
    });

    bringAlongSuggestions.push({
    item: "Light jacket",
    reason: "It may feel noticeably colder later in the selected window.",
    });
} else if (tempDrop >= 7) {
    alerts.push({
    type: "temperature-drop",
    message: `It may cool down about ${Math.round(
        tempDrop
    )}°F during ${windowLabel.toLowerCase()}.`,
    });

    bringAlongSuggestions.push({
    item: "Light layer",
    reason: "A small layer could help if you are out later.",
    });
}

if (lowestWindowFeelsLike <= 45 && feelsLike > 50) {
    alerts.push({
    type: "chilly-later",
    message: `Feels-like temperature may reach ${Math.round(
        lowestWindowFeelsLike
    )}°F during ${windowLabel.toLowerCase()}.`,
    });

    bringAlongSuggestions.push({
    item: "Light or medium jacket",
    reason: "The selected window includes jacket-worthy temperatures.",
    });
}

if (highestWindowWind >= 22) {
    alerts.push({
    type: "wind",
    message: `Wind may reach ${Math.round(
        highestWindowWind
    )} mph during ${windowLabel.toLowerCase()}.`,
    });

    bringAlongSuggestions.push({
    item: "Windbreaker",
    reason: "Wind can make mild temperatures feel colder.",
    });
} else if (highestWindowWind >= 16) {
    alerts.push({
    type: "wind",
    message: `Breezy conditions may reach ${Math.round(
        highestWindowWind
    )} mph during ${windowLabel.toLowerCase()}.`,
    });

    bringAlongSuggestions.push({
    item: "Light windbreaker",
    reason: "A wind-resistant layer could help.",
    });
}
}

if (dailyLow <= 45 && feelsLike > 50 && windowId === "rest_of_day") {
alerts.push({
    type: "daily-low",
    message: `Today's low is ${Math.round(
    dailyLow
    )}°F, so it may get chilly later.`,
});

bringAlongSuggestions.push({
    item: "Light jacket",
    reason: "The daily low is jacket-worthy later in the day.",
});
}

const uniqueBringAlongSuggestions = bringAlongSuggestions.filter(
(suggestion, index, self) =>
    index === self.findIndex((item) => item.item === suggestion.item)
);

return {
windowId,
windowLabel,
windowHours,
alerts,
bringAlongSuggestions: uniqueBringAlongSuggestions,
lowestWindowFeelsLike,
highestWindowFeelsLike,
highestWindowRainChance,
highestWindowWind,
tempDrop,
};
}