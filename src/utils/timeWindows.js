export const TIME_WINDOWS = [
{
    id: "now",
    label: "Right now",
    description: "Current conditions only",
},
{
    id: "rest_of_day",
    label: "Rest of today",
    description: "From now through the end of today",
},
{
    id: "tomorrow",
    label: "Tomorrow",
    description: "Tomorrow's full daytime forecast",
},
{
    id: "tomorrow_night",
    label: "Tomorrow night",
    description: "Tomorrow evening and overnight conditions",
},
];

export function getTimeWindowLabel(windowId) {
return (
    TIME_WINDOWS.find(
    (window) => window.id === windowId
    )?.label || "Rest of today"
);
}

function getDatePart(hour) {
if (typeof hour?.time !== "string") {
    return "";
}

return hour.time.split(" ")[0] || "";
}

function getHourPart(hour) {
if (typeof hour?.time !== "string") {
    return null;
}

const timePart = hour.time.split(" ")[1];

if (!timePart) {
    return null;
}

const hourNumber = Number(
    timePart.split(":")[0]
);

return Number.isFinite(hourNumber)
    ? hourNumber
    : null;
}

function getCurrentDate(weather) {
if (typeof weather?.localTime === "string") {
    return weather.localTime.split(" ")[0] || "";
}

return "";
}

function findTomorrowDate(allHours, currentDate) {
const dates = [
    ...new Set(
    allHours
        .map(getDatePart)
        .filter(Boolean)
    ),
];

return (
    dates.find((date) => date !== currentDate) || ""
);
}

export function getForecastWindowHours(
weather,
windowId = "rest_of_day"
) {
const allHours =
    weather?.forecastHours ||
    weather?.upcomingHours ||
    [];

if (windowId === "now" || allHours.length === 0) {
    return [];
}

const currentEpoch = weather?.currentEpoch;
const currentDate = getCurrentDate(weather);

const futureHours = allHours.filter((hour) => {
    if (!hour?.timeEpoch || !currentEpoch) {
    return true;
    }

    return hour.timeEpoch >= currentEpoch;
});

if (windowId === "rest_of_day") {
    return futureHours.filter(
    (hour) => getDatePart(hour) === currentDate
    );
}

const tomorrowDate = findTomorrowDate(
    allHours,
    currentDate
);

if (!tomorrowDate) {
    return [];
}

if (windowId === "tomorrow") {
    return allHours.filter((hour) => {
    const date = getDatePart(hour);
    const hourNumber = getHourPart(hour);

    return (
        date === tomorrowDate &&
        hourNumber !== null &&
        hourNumber >= 6 &&
        hourNumber < 18
    );
    });
}

if (windowId === "tomorrow_night") {
    return allHours.filter((hour) => {
    const date = getDatePart(hour);
    const hourNumber = getHourPart(hour);

    return (
        date === tomorrowDate &&
        hourNumber !== null &&
        hourNumber >= 18
    );
    });
}

return futureHours;
}