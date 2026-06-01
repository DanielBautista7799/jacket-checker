import { useState } from "react";

function useLocationSearch() {
const [locations, setLocations] = useState([]);
const [locationLoading, setLocationLoading] = useState(false);
const [locationError, setLocationError] = useState("");

const searchLocations = async (query) => {
if (!query || query.length < 2) {
    setLocations([]);
    return;
}

setLocationLoading(true);
setLocationError("");

try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey) {
    throw new Error("Missing WeatherAPI key.");
    }

    const response = await fetch(
    `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(
        query
    )}`
    );

    const data = await response.json();

    if (data.error) {
    throw new Error(data.error.message);
    }

    setLocations(data);
} catch (err) {
    setLocationError(err.message || "Could not search locations.");
    setLocations([]);
} finally {
    setLocationLoading(false);
}
};

return {
locations,
locationLoading,
locationError,
searchLocations,
setLocations,
};
}

export default useLocationSearch;