import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export const WeatherContext = createContext(null);

const CACHE_VERSION = 1;
const WEATHER_TTL_MS = 10 * 60 * 1000;
const weatherMemoryCache = new Map();
const inFlightWeatherRequests = new Map();

function getLocationKey(location) {
  if (typeof location === "string") {
    return location.trim().toLowerCase();
  }

  if (
    location &&
    Number.isFinite(Number(location.lat)) &&
    Number.isFinite(Number(location.lon))
  ) {
    return `${Number(location.lat).toFixed(4)},${Number(
      location.lon
    ).toFixed(4)}`;
  }

  return "";
}

function getStorageKey(locationKey) {
  return `jacket-check:weather:v${CACHE_VERSION}:${locationKey}`;
}

function readWeatherCache(locationKey) {
  if (!locationKey) {
    return null;
  }

  const memoryEntry = weatherMemoryCache.get(locationKey);

  if (
    memoryEntry &&
    Date.now() - memoryEntry.savedAt < WEATHER_TTL_MS
  ) {
    return memoryEntry;
  }

  try {
    const raw = sessionStorage.getItem(
      getStorageKey(locationKey)
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      Date.now() - Number(parsed.savedAt) >=
      WEATHER_TTL_MS
    ) {
      sessionStorage.removeItem(
        getStorageKey(locationKey)
      );
      return null;
    }

    const entry = {
      weather: parsed.weather,
      savedAt: Number(parsed.savedAt),
    };

    weatherMemoryCache.set(locationKey, entry);

    return entry;
  } catch (error) {
    console.error("Could not read weather cache:", error);
    return null;
  }
}

function writeWeatherCache(locationKey, weather) {
  if (!locationKey) {
    return;
  }

  const entry = {
    weather,
    savedAt: Date.now(),
  };

  weatherMemoryCache.set(locationKey, entry);

  try {
    sessionStorage.setItem(
      getStorageKey(locationKey),
      JSON.stringify(entry)
    );
  } catch (error) {
    console.error("Could not write weather cache:", error);
  }
}

function formatWeatherResponse(data) {
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

  return {
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
}

async function requestWeather(location, locationKey) {
  if (inFlightWeatherRequests.has(locationKey)) {
    return inFlightWeatherRequests.get(locationKey);
  }

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing WeatherAPI key. Check your .env file."
    );
  }

  const query =
    typeof location === "string"
      ? location
      : `${location.lat},${location.lon}`;

  const request = fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
      query
    )}&days=2&aqi=no&alerts=no`
  )
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data?.error?.message ||
            "Could not load the weather."
        );
      }

      return formatWeatherResponse(data);
    })
    .finally(() => {
      inFlightWeatherRequests.delete(locationKey);
    });

  inFlightWeatherRequests.set(locationKey, request);

  return request;
}

export function WeatherProvider({ children }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const activeLocationKeyRef = useRef("");

  const fetchWeather = useCallback(
    async (
      location,
      {
        force = false,
        background = false,
      } = {}
    ) => {
      const locationKey = getLocationKey(location);

      if (!locationKey) {
        return null;
      }

      activeLocationKeyRef.current = locationKey;

      const cached = readWeatherCache(locationKey);

      if (!force && cached) {
        setWeather(cached.weather);
        setError("");

        if (!background) {
          return cached.weather;
        }
      }

      if (cached || background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await requestWeather(
          location,
          locationKey
        );

        writeWeatherCache(locationKey, result);

        if (activeLocationKeyRef.current === locationKey) {
          setWeather(result);
        }

        return result;
      } catch (requestError) {
        console.error("Weather fetch failed:", requestError);

        if (activeLocationKeyRef.current === locationKey) {
          setError(
            requestError.message || "Something went wrong."
          );

          if (!cached) {
            setWeather(null);
          }
        }

        return cached?.weather || null;
      } finally {
        if (activeLocationKeyRef.current === locationKey) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  const clearWeather = useCallback(() => {
    activeLocationKeyRef.current = "";
    setWeather(null);
    setError("");
    setLoading(false);
    setRefreshing(false);
  }, []);

  const value = useMemo(
    () => ({
      weather,
      loading,
      refreshing,
      error,
      fetchWeather,
      clearWeather,
    }),
    [
      weather,
      loading,
      refreshing,
      error,
      fetchWeather,
      clearWeather,
    ]
  );

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}
