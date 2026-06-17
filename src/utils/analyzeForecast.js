import {
getForecastWindowHours,
getTimeWindowLabel,
} from "./timeWindows";

function getNumericValues(hours, key) {
return hours
    .map((hour) => Number(hour?.[key]))
    .filter(Number.isFinite);
}

function getMinimum(values, fallback) {
return values.length > 0
    ? Math.min(...values)
    : fallback;
}

function getMaximum(values, fallback) {
return values.length > 0
    ? Math.max(...values)
    : fallback;
}

function getAverage(values, fallback) {
if (values.length === 0) {
    return fallback;
}

return (
    values.reduce((total, value) => total + value, 0) /
    values.length
);
}

export function analyzeForecast(
weather,
windowId = "rest_of_day"
) {
const alerts = [];
const bringAlongSuggestions = [];

const windowHours = getForecastWindowHours(
    weather,
    windowId
);

const windowLabel = getTimeWindowLabel(windowId);

const currentFeelsLike =
    Number(weather?.feelsLike) || 65;

const currentRainChance =
    Number(weather?.rainChance) || 0;

const currentWind =
    Number(weather?.windSpeed) || 0;

const fallbackMaxWind =
    Number(weather?.maxWind) || currentWind;

const feelsLikeValues = getNumericValues(
    windowHours,
    "feelsLike"
);

const rainValues = getNumericValues(
    windowHours,
    "rainChance"
);

const windValues = getNumericValues(
    windowHours,
    "windSpeed"
);

const lowestWindowFeelsLike = getMinimum(
    feelsLikeValues,
    currentFeelsLike
);

const highestWindowFeelsLike = getMaximum(
    feelsLikeValues,
    currentFeelsLike
);

const averageWindowFeelsLike = getAverage(
    feelsLikeValues,
    currentFeelsLike
);

const highestWindowRainChance = getMaximum(
    rainValues,
    currentRainChance
);

const highestWindowWind = getMaximum(
    windValues,
    fallbackMaxWind
);

const selectedWindowStartFeelsLike =
    feelsLikeValues[0] ?? currentFeelsLike;

const tempDrop =
    selectedWindowStartFeelsLike -
    lowestWindowFeelsLike;

if (windowId !== "now") {
    if (highestWindowRainChance >= 60) {
    alerts.push({
        type: "rain",
        message: `Rain is likely during ${windowLabel.toLowerCase()}, reaching about ${Math.round(
        highestWindowRainChance
        )}%.`,
    });

    bringAlongSuggestions.push({
        item: "Light rain shell",
        reason:
        "Rain is likely, so a packable waterproof layer may be useful.",
    });
    } else if (highestWindowRainChance >= 35) {
    alerts.push({
        type: "rain",
        message: `There is some rain risk during ${windowLabel.toLowerCase()}, reaching about ${Math.round(
        highestWindowRainChance
        )}%.`,
    });

    bringAlongSuggestions.push({
        item: "Packable rain layer",
        reason:
        "Rain is possible, so a small waterproof backup could help.",
    });
    }

    if (lowestWindowFeelsLike <= 55) {
    bringAlongSuggestions.push({
        item: "Light layer",
        reason: `It may feel as cool as ${Math.round(
        lowestWindowFeelsLike
        )}°F during the selected window.`,
    });
    }

    if (lowestWindowFeelsLike <= 45) {
    alerts.push({
        type: "chilly",
        message: `It may feel around ${Math.round(
        lowestWindowFeelsLike
        )}°F during ${windowLabel.toLowerCase()}.`,
    });
    } else if (tempDrop >= 8) {
    alerts.push({
        type: "temperature-drop",
        message: `Temperatures may drop around ${Math.round(
        tempDrop
        )}°F during ${windowLabel.toLowerCase()}.`,
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
        item: "Light windbreaker",
        reason:
        "Strong wind may make the selected window feel cooler.",
    });
    } else if (highestWindowWind >= 16) {
    alerts.push({
        type: "wind",
        message: `Breezy conditions may reach ${Math.round(
        highestWindowWind
        )} mph during ${windowLabel.toLowerCase()}.`,
    });
    }
}

const uniqueBringAlongSuggestions =
    bringAlongSuggestions.filter(
    (suggestion, index, self) =>
        index ===
        self.findIndex(
        (item) => item.item === suggestion.item
        )
    );

return {
    windowId,
    windowLabel,
    windowHours,
    alerts,
    bringAlongSuggestions:
    uniqueBringAlongSuggestions,
    lowestWindowFeelsLike,
    highestWindowFeelsLike,
    averageWindowFeelsLike,
    highestWindowRainChance,
    highestWindowWind,
    tempDrop,
};
}