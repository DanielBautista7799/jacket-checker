import { useState } from "react";

function useWeather() {
const [weather, setWeather] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const fetchWeather = async (location) => {
if (!location) return null;

setLoading(true);
setError("");

try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey) {
    throw new Error("Missing WeatherAPI key. Check your .env file.");
    }

    const query =
    typeof location === "string"
        ? location
        : `${location.lat},${location.lon}`;

    const response = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
        query
    )}&days=2&aqi=no&alerts=no`
    );

    const data = await response.json();

    if (data.error) {
    throw new Error(data.error.message);
    }

    const forecastDays = data.forecast.forecastday;

    const forecastHours = forecastDays.flatMap((day) =>
    day.hour.map((hour) => ({
        time: hour.time,
        timeEpoch: hour.time_epoch,
        temp: hour.temp_f,
        feelsLike: hour.feelslike_f,
        rainChance: hour.chance_of_rain,
        windSpeed: hour.wind_mph,
        condition: hour.condition.text,
    }))
    );

    const currentEpoch = data.current.last_updated_epoch;
    const today = forecastDays[0];

    const upcomingHours = forecastHours
    .filter((hour) => hour.timeEpoch >= currentEpoch)
    .slice(0, 6);

    const formattedWeather = {
    city: data.location.name,
    region: data.location.region,
    country: data.location.country,
    localTime: data.location.localtime,
    currentEpoch,

    temperature: data.current.temp_f,
    feelsLike: data.current.feelslike_f,
    windSpeed: data.current.wind_mph,
    condition: data.current.condition.text,
    description: data.current.condition.text,

    dailyHigh: today.day.maxtemp_f,
    dailyLow: today.day.mintemp_f,
    rainChance: today.day.daily_chance_of_rain,
    maxWind: today.day.maxwind_mph,
    willRain: today.day.daily_will_it_rain,

    forecastHours,
    upcomingHours,
    };

    setWeather(formattedWeather);
    return formattedWeather;
} catch (err) {
    setWeather(null);
    setError(err.message || "Something went wrong.");
    return null;
} finally {
    setLoading(false);
}
};

return {
weather,
loading,
error,
fetchWeather,
};
}

export default useWeather;