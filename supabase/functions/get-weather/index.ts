import { handleCorsPreflight, isOriginAllowed } from "../_shared/security/cors.ts";
import { enforceRateLimit } from "../_shared/security/rateLimit.ts";
import { getRequestId } from "../_shared/security/requestId.ts";
import { jsonResponse as secureJsonResponse, safeErrorResponse, SafeHttpError } from "../_shared/security/safeError.ts";
import { readJsonBody } from "../_shared/security/validateJsonBody.ts";
import { logSecurityEvent } from "../_shared/security/logSecurityEvent.ts";

const WEATHER_API_BASE_URL =
"https://api.weatherapi.com/v1";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_UPSTREAM_ATTEMPTS = 3;
const SERVER_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const RETRYABLE_STATUS_CODES = new Set([
408,
429,
500,
502,
503,
504,
]);

type WeatherAction = "forecast" | "search";

type CacheEntry = {
payload: unknown;
savedAt: number;
};

type ForecastLocationInput =
| {
    query: string;
    }
| {
    lat: number;
    lon: number;
    };

const responseCache = new Map<string, CacheEntry>();

function jsonResponse(
request: Request,
body: unknown,
status = 200,
requestId?: string,
): Response {
return secureJsonResponse(request, body, status, requestId);
}

function sleep(
milliseconds: number
): Promise<void> {
return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});
}

function normalizeText(
value: unknown
): string {
return typeof value === "string"
    ? value.trim()
    : "";
}

function isFiniteNumber(
value: unknown
): boolean {
return Number.isFinite(Number(value));
}

function getCachedPayload(
cacheKey: string
): unknown | null {
const entry =
    responseCache.get(cacheKey);

if (!entry) {
    return null;
}

if (
    Date.now() - entry.savedAt >=
    SERVER_CACHE_TTL_MS
) {
    responseCache.delete(cacheKey);
    return null;
}

return entry.payload;
}

function setCachedPayload(
cacheKey: string,
payload: unknown
): void {
if (
    responseCache.size >=
    MAX_CACHE_ENTRIES
) {
    const oldestKey =
    responseCache.keys().next().value;

    if (oldestKey) {
    responseCache.delete(oldestKey);
    }
}

responseCache.set(cacheKey, {
    payload,
    savedAt: Date.now(),
});
}

function getForecastLocationInput(
body: Record<string, unknown>
): ForecastLocationInput {
const query =
    normalizeText(body.query);

if (query) {
    if (
    query.length < 2 ||
    query.length > 120
    ) {
    throw new Error(
        "Enter a location between 2 and 120 characters."
    );
    }

    return {
    query,
    };
}

if (
    !isFiniteNumber(body.lat) ||
    !isFiniteNumber(body.lon)
) {
    throw new Error(
    "Provide a location name or valid coordinates."
    );
}

const lat = Number(body.lat);
const lon = Number(body.lon);

if (
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
) {
    throw new Error(
    "The supplied coordinates are outside the valid range."
    );
}

return {
    lat,
    lon,
};
}

function getForecastQuery(
input: ForecastLocationInput
): string {
if ("query" in input) {
    return input.query;
}

return `${input.lat},${input.lon}`;
}

function getForecastCacheKey(
input: ForecastLocationInput
): string {
if ("query" in input) {
    return `forecast:query:${input.query.toLowerCase()}`;
}

return `forecast:coords:${input.lat.toFixed(
    4
)},${input.lon.toFixed(4)}`;
}

function getSearchQuery(
body: Record<string, unknown>
): string {
const query =
    normalizeText(body.query);

if (
    query.length < 2 ||
    query.length > 120
) {
    throw new Error(
    "Enter at least 2 characters to search for a location."
    );
}

return query;
}

async function readJsonResponse(
response: Response
): Promise<any> {
const text =
    await response.text();

if (!text) {
    return null;
}

try {
    return JSON.parse(text);
} catch {
    throw new Error(
    "WeatherAPI returned an invalid response."
    );
}
}

async function requestWeatherApi(
path: string,
parameters: URLSearchParams,
apiKey: string
): Promise<any> {
parameters.set("key", apiKey);

const url =
    `${WEATHER_API_BASE_URL}/${path}` +
    `?${parameters.toString()}`;

let finalError: Error | null =
    null;

for (
    let attempt = 1;
    attempt <= MAX_UPSTREAM_ATTEMPTS;
    attempt += 1
) {
    const controller =
    new AbortController();

    const timeoutId =
    setTimeout(() => {
        controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
    const response =
        await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
            Accept: "application/json",
        },
        });

    const payload =
        await readJsonResponse(
        response
        );

    if (
        response.ok &&
        !payload?.error
    ) {
        return payload;
    }

    const message =
        payload?.error?.message ||
        `WeatherAPI request failed with status ${response.status}.`;

    finalError =
        new Error(message);

    if (
        !RETRYABLE_STATUS_CODES.has(
        response.status
        ) ||
        attempt ===
        MAX_UPSTREAM_ATTEMPTS
    ) {
        throw finalError;
    }
    } catch (error) {
    if (
        error instanceof DOMException &&
        error.name === "AbortError"
    ) {
        finalError =
        new Error(
            "The weather service timed out. Try again."
        );
    } else if (
        error instanceof Error
    ) {
        finalError = error;
    } else {
        finalError =
        new Error(
            "Could not reach the weather service."
        );
    }

    if (
        attempt ===
        MAX_UPSTREAM_ATTEMPTS
    ) {
        throw finalError;
    }
    } finally {
    clearTimeout(timeoutId);
    }

    await sleep(
    250 * 2 ** (attempt - 1)
    );
}

throw (
    finalError ||
    new Error(
    "Could not load weather data."
    )
);
}

function normalizeForecastResponse(
data: any
) {
const forecastDays =
    Array.isArray(
    data?.forecast?.forecastday
    )
    ? data.forecast.forecastday
    : [];

const today =
    forecastDays[0];

if (
    !data?.location ||
    !data?.current ||
    !today?.day
) {
    throw new Error(
    "WeatherAPI returned incomplete forecast data."
    );
}

const forecastHours =
    forecastDays.flatMap(
    (day: any) =>
        Array.isArray(day?.hour)
        ? day.hour.map(
            (hour: any) => ({
                time: hour.time,
                timeEpoch:
                hour.time_epoch,
                temp: hour.temp_f,
                feelsLike:
                hour.feelslike_f,
                rainChance:
                hour.chance_of_rain,
                windSpeed:
                hour.wind_mph,
                condition:
                hour?.condition
                    ?.text ||
                "Unknown",
            })
            )
        : []
    );

const currentEpoch =
    data.current
    .last_updated_epoch;

const upcomingHours =
    forecastHours
    .filter(
        (hour: any) =>
        hour.timeEpoch >=
        currentEpoch
    )
    .slice(0, 6);

return {
    city: data.location.name,
    region: data.location.region,
    country:
    data.location.country,
    localTime:
    data.location.localtime,
    currentEpoch,

    temperature:
    data.current.temp_f,
    feelsLike:
    data.current.feelslike_f,
    windSpeed:
    data.current.wind_mph,
    condition:
    data.current.condition.text,
    description:
    data.current.condition.text,

    dailyHigh:
    today.day.maxtemp_f,
    dailyLow:
    today.day.mintemp_f,
    rainChance:
    today.day
        .daily_chance_of_rain,
    maxWind:
    today.day.maxwind_mph,
    willRain:
    today.day
        .daily_will_it_rain,

    forecastHours,
    upcomingHours,
};
}

function normalizeLocationSearchResponse(
data: any
) {
if (!Array.isArray(data)) {
    throw new Error(
    "WeatherAPI returned invalid location results."
    );
}

return data
    .slice(0, 10)
    .map(
    (location: any) => ({
        id:
        location.id ??
        `${
            location.lat ?? ""
        }:${
            location.lon ?? ""
        }:${
            location.name ?? ""
        }`,

        name:
        location.name ||
        "Unknown location",

        region:
        location.region || "",

        country:
        location.country || "",

        lat:
        Number(location.lat),

        lon:
        Number(location.lon),

        url:
        location.url || "",
    })
    );
}

async function handleForecast(
request: Request,
body: Record<string, unknown>,
apiKey: string,
requestId: string,
): Promise<Response> {
const input =
    getForecastLocationInput(body);

const cacheKey =
    getForecastCacheKey(input);

const cached =
    getCachedPayload(cacheKey);

if (cached) {
    return jsonResponse(request, {
    success: true,
    weather: cached,
    cached: true,
    }, 200, requestId);
}

const parameters =
    new URLSearchParams({
    q: getForecastQuery(input),
    days: "2",
    aqi: "no",
    alerts: "no",
    });

const rawData =
    await requestWeatherApi(
    "forecast.json",
    parameters,
    apiKey
    );

const weather =
    normalizeForecastResponse(
    rawData
    );

setCachedPayload(
    cacheKey,
    weather
);

return jsonResponse(request, {
    success: true,
    weather,
    cached: false,
}, 200, requestId);
}

async function handleSearch(
request: Request,
body: Record<string, unknown>,
apiKey: string,
requestId: string,
): Promise<Response> {
const query =
    getSearchQuery(body);

const cacheKey =
    `search:${query.toLowerCase()}`;

const cached =
    getCachedPayload(cacheKey);

if (cached) {
    return jsonResponse(request, {
    success: true,
    locations: cached,
    cached: true,
    }, 200, requestId);
}

const parameters =
    new URLSearchParams({
    q: query,
    });

const rawData =
    await requestWeatherApi(
    "search.json",
    parameters,
    apiKey
    );

const locations =
    normalizeLocationSearchResponse(
    rawData
    );

setCachedPayload(
    cacheKey,
    locations
);

return jsonResponse(request, {
    success: true,
    locations,
    cached: false,
}, 200, requestId);
}

Deno.serve(async (request: Request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  const requestId = getRequestId(request);

  try {
    if (!isOriginAllowed(request)) {
      throw new SafeHttpError(403, "origin_not_allowed", "This request origin is not allowed.");
    }
    if (request.method !== "POST") {
      throw new SafeHttpError(405, "method_not_allowed", "POST is required.");
    }

    await enforceRateLimit({
      request,
      functionName: "get-weather",
      limit: 90,
      windowSeconds: 3600,
    });

    const apiKey = Deno.env.get("WEATHER_API_KEY");
    if (!apiKey) {
      throw new SafeHttpError(503, "weather_not_configured", "Weather service configuration is unavailable.");
    }

    const requestBody = await readJsonBody<Record<string, unknown>>(request, 16 * 1024);
    const action = normalizeText(requestBody.action) as WeatherAction;

    if (action === "forecast") {
      return await handleForecast(request, requestBody, apiKey, requestId);
    }
    if (action === "search") {
      return await handleSearch(request, requestBody, apiKey, requestId);
    }
    throw new SafeHttpError(400, "unsupported_action", "Action must be either forecast or search.");
  } catch (error) {
    if (error instanceof SafeHttpError) {
      return safeErrorResponse(request, error, requestId);
    }

    const message = error instanceof Error ? error.message : "Could not complete the weather request.";
    const invalidInput = /location|coordinates|characters|request body|search/i.test(message);
    logSecurityEvent(invalidInput ? "warn" : "error", "weather_request_failed", {
      requestId,
      code: invalidInput ? "invalid_weather_request" : "weather_upstream_error",
    });
    return jsonResponse(
      request,
      {
        success: false,
        error: invalidInput ? message : "Weather information is temporarily unavailable. Try again shortly.",
        code: invalidInput ? "invalid_weather_request" : "weather_upstream_error",
      },
      invalidInput ? 400 : 502,
      requestId,
    );
  }
});
