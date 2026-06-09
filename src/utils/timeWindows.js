export const TIME_WINDOWS = [
{
    id: "now",
    label: "Right now",
    description: "Only current conditions",
},
{
    id: "next_2_hours",
    label: "Next 2 hours",
    description: "Short errand or quick walk",
},
{
    id: "next_4_hours",
    label: "Next 4 hours",
    description: "Class, errands, or afternoon plans",
},
{
    id: "rest_of_day",
    label: "Rest of today",
    description: "Most useful general forecast window",
},
{
    id: "tonight",
    label: "Tonight",
    description: "Evening temperature drops",
},
{
    id: "tomorrow_morning",
    label: "Tomorrow morning",
    description: "Early next-day conditions",
},
];

export function getTimeWindowLabel(windowId) {
return TIME_WINDOWS.find((window) => window.id === windowId)?.label || "Rest of today";
}

export function getForecastWindowHours(weather, windowId = "rest_of_day") {
const allHours = weather.forecastHours || weather.upcomingHours || [];

if (windowId === "now" || allHours.length === 0) {
    return [];
}

const currentEpoch = weather.currentEpoch;

const futureHours = allHours.filter((hour) => {
    if (!hour.timeEpoch || !currentEpoch) return true;
    return hour.timeEpoch >= currentEpoch;
});

if (windowId === "next_2_hours") {
    return futureHours.slice(0, 2);
}

if (windowId === "next_4_hours") {
    return futureHours.slice(0, 4);
}

if (windowId === "rest_of_day") {
    const currentDate = weather.localTime?.split(" ")[0];

    return futureHours.filter((hour) => {
    const hourDate = hour.time.split(" ")[0];
    return hourDate === currentDate;
    });
}

if (windowId === "tonight") {
    const currentDate = weather.localTime?.split(" ")[0];

    return futureHours.filter((hour) => {
    const hourDate = hour.time.split(" ")[0];
    const hourNumber = Number(hour.time.split(" ")[1].split(":")[0]);

    return hourDate === currentDate && hourNumber >= 18;
    });
}

if (windowId === "tomorrow_morning") {
    const currentDate = weather.localTime?.split(" ")[0];

    const tomorrowHours = allHours.filter((hour) => {
    const hourDate = hour.time.split(" ")[0];
    const hourNumber = Number(hour.time.split(" ")[1].split(":")[0]);

    return hourDate !== currentDate && hourNumber >= 5 && hourNumber <= 11;
    });

    return tomorrowHours;
}

return futureHours.slice(0, 6);
}