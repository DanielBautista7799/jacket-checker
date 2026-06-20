import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

export const WeatherContext =
  createContext(null);

const CACHE_VERSION = 1;
const WEATHER_TTL_MS =
  10 * 60 * 1000;

const weatherMemoryCache =
  new Map();

const inFlightWeatherRequests =
  new Map();

function getLocationKey(
  location
) {
  if (
    typeof location === "string"
  ) {
    return location
      .trim()
      .toLowerCase();
  }

  if (
    location &&
    Number.isFinite(
      Number(location.lat)
    ) &&
    Number.isFinite(
      Number(location.lon)
    )
  ) {
    return `${Number(
      location.lat
    ).toFixed(4)},${Number(
      location.lon
    ).toFixed(4)}`;
  }

  return "";
}

function getStorageKey(
  locationKey
) {
  return `jacket-check:weather:v${CACHE_VERSION}:${locationKey}`;
}

function readWeatherCache(
  locationKey
) {
  if (!locationKey) {
    return null;
  }

  const memoryEntry =
    weatherMemoryCache.get(
      locationKey
    );

  if (
    memoryEntry &&
    Date.now() -
      memoryEntry.savedAt <
      WEATHER_TTL_MS
  ) {
    return memoryEntry;
  }

  try {
    const raw =
      sessionStorage.getItem(
        getStorageKey(
          locationKey
        )
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      Date.now() -
        Number(
          parsed.savedAt
        ) >=
      WEATHER_TTL_MS
    ) {
      sessionStorage.removeItem(
        getStorageKey(
          locationKey
        )
      );

      return null;
    }

    const entry = {
      weather:
        parsed.weather,
      savedAt:
        Number(
          parsed.savedAt
        ),
    };

    weatherMemoryCache.set(
      locationKey,
      entry
    );

    return entry;
  } catch (error) {
    console.error(
      "Could not read weather cache:",
      error
    );

    return null;
  }
}

function writeWeatherCache(
  locationKey,
  weather
) {
  if (!locationKey) {
    return;
  }

  const entry = {
    weather,
    savedAt:
      Date.now(),
  };

  weatherMemoryCache.set(
    locationKey,
    entry
  );

  try {
    sessionStorage.setItem(
      getStorageKey(
        locationKey
      ),
      JSON.stringify(
        entry
      )
    );
  } catch (error) {
    console.error(
      "Could not write weather cache:",
      error
    );
  }
}

async function readErrorPayload(
  response
) {
  if (
    !(
      response instanceof
      Response
    )
  ) {
    return null;
  }

  try {
    return await response
      .clone()
      .json();
  } catch {
    try {
      const text =
        await response
          .clone()
          .text();

      return text
        ? {
            error: text,
          }
        : null;
    } catch {
      return null;
    }
  }
}

async function getFunctionErrorMessage(
  error
) {
  const payload =
    await readErrorPayload(
      error?.context
    );

  if (
    typeof payload?.error ===
      "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  if (
    typeof error?.message ===
      "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Could not load the weather.";
}

function getForecastRequestBody(
  location
) {
  if (
    typeof location ===
    "string"
  ) {
    return {
      action: "forecast",
      query:
        location.trim(),
    };
  }

  return {
    action: "forecast",
    lat: Number(
      location.lat
    ),
    lon: Number(
      location.lon
    ),
  };
}

async function requestWeather(
  location,
  locationKey
) {
  if (
    inFlightWeatherRequests.has(
      locationKey
    )
  ) {
    return inFlightWeatherRequests.get(
      locationKey
    );
  }

  const request =
    supabase.functions
      .invoke(
        "get-weather",
        {
          body:
            getForecastRequestBody(
              location
            ),
        }
      )
      .then(
        async ({
          data,
          error,
        }) => {
          if (error) {
            throw new Error(
              await getFunctionErrorMessage(
                error
              )
            );
          }

          if (
            !data?.success ||
            !data?.weather
          ) {
            throw new Error(
              data?.error ||
                "Could not load the weather."
            );
          }

          return data.weather;
        }
      )
      .finally(() => {
        inFlightWeatherRequests.delete(
          locationKey
        );
      });

  inFlightWeatherRequests.set(
    locationKey,
    request
  );

  return request;
}

export function WeatherProvider({
  children,
}) {
  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const activeLocationKeyRef =
    useRef("");

  const fetchWeather =
    useCallback(
      async (
        location,
        {
          force = false,
          background = false,
        } = {}
      ) => {
        const locationKey =
          getLocationKey(
            location
          );

        if (!locationKey) {
          return null;
        }

        activeLocationKeyRef.current =
          locationKey;

        const cached =
          readWeatherCache(
            locationKey
          );

        if (
          !force &&
          cached
        ) {
          setWeather(
            cached.weather
          );

          setError("");

          if (!background) {
            return cached.weather;
          }
        }

        if (
          cached ||
          background
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const result =
            await requestWeather(
              location,
              locationKey
            );

          writeWeatherCache(
            locationKey,
            result
          );

          if (
            activeLocationKeyRef.current ===
            locationKey
          ) {
            setWeather(
              result
            );
          }

          return result;
        } catch (
          requestError
        ) {
          console.error(
            "Weather fetch failed:",
            requestError
          );

          if (
            activeLocationKeyRef.current ===
            locationKey
          ) {
            setError(
              requestError.message ||
                "Something went wrong."
            );

            if (!cached) {
              setWeather(
                null
              );
            }
          }

          return (
            cached?.weather ||
            null
          );
        } finally {
          if (
            activeLocationKeyRef.current ===
            locationKey
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      []
    );

  const clearWeather =
    useCallback(() => {
      activeLocationKeyRef.current =
        "";

      setWeather(null);
      setError("");
      setLoading(false);
      setRefreshing(
        false
      );
    }, []);

  const value =
    useMemo(
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
    <WeatherContext.Provider
      value={value}
    >
      {children}
    </WeatherContext.Provider>
  );
}