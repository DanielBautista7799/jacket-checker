import { useState } from "react";

function useWeather() {
const [weather, setWeather] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const fetchWeather = async (city) => {
if (!city) return null;

setLoading(true);
setError("");

try {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`
    );

    if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch weather.");
    }

    const data = await response.json();

    const formattedWeather = {
    city: data.name,
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    windSpeed: data.wind.speed,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    };

    setWeather(formattedWeather);
    return formattedWeather;
} catch (err) {
    setError(err.message || "Something went wrong.");
    setWeather(null);
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