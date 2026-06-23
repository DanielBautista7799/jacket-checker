import {
  JACKET_COLORS,
  JACKET_FITS,
  JACKET_MATERIALS,
  JACKET_STYLE_TAGS,
  JACKET_SUBTYPES,
  JACKET_WEATHER_USES,
  type JacketColor,
  type JacketFit,
  type JacketMaterial,
  type JacketStyleTag,
  type JacketSubtype,
  type JacketWeatherUse,
  type NormalizedJacketAnalysis,
} from "./jacketAnalysisSchema.ts";

type RawObject = Record<string, unknown>;

function normalizeToken(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[&/]+/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function clampRating(value: unknown, fallback = 1): number {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(5, Math.max(1, Math.round(number)))
    : fallback;
}

function clampConfidence(value: unknown, fallback = 0.5): number {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(1, Math.max(0, number))
    : fallback;
}

function normalizeFromAllowed<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
  aliases: Record<string, T[number]> = {},
): T[number] {
  const token = normalizeToken(value);

  if (allowed.includes(token as T[number])) {
    return token as T[number];
  }

  return aliases[token] || fallback;
}

function normalizeArray<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  aliases: Record<string, T[number]> = {},
): T[number][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((entry) => {
          const token = normalizeToken(entry);
          if (allowed.includes(token as T[number])) {
            return token as T[number];
          }
          return aliases[token] || null;
        })
        .filter((entry): entry is T[number] => Boolean(entry)),
    ),
  ].slice(0, 6);
}

function normalizeSubtype(value: unknown): JacketSubtype {
  return normalizeFromAllowed(value, JACKET_SUBTYPES, "other", {
    shell: "rain_shell",
    shell_jacket: "rain_shell",
    raincoat: "rain_jacket",
    jean_jacket: "denim_jacket",
    down_jacket: "puffer",
    parka: "heavy_coat",
    wool_coat: "overcoat",
    varsity: "varsity_jacket",
    chore_jacket: "utility_jacket",
    track_jacket: "windbreaker",
  });
}

function normalizeColor(value: unknown, fallback: JacketColor): JacketColor {
  return normalizeFromAllowed(
    value,
    JACKET_COLORS.filter((color) => color !== "none") as readonly JacketColor[],
    fallback,
    {
      charcoal: "grey",
      gray: "grey",
      lightblue: "light_blue",
      dark_blue: "navy",
      maroon: "burgundy",
      khaki: "tan",
      off_white: "cream",
    },
  );
}

function normalizeSecondaryColor(value: unknown): JacketColor | null {
  const token = normalizeToken(value);
  if (!token || token === "none" || token === "null" || token === "n_a") {
    return null;
  }
  return normalizeColor(value, "other");
}

export function normalizeJacketAnalysis(rawValue: unknown): NormalizedJacketAnalysis {
  const raw = rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
    ? rawValue as RawObject
    : {};

  const confidenceRaw = raw.confidence && typeof raw.confidence === "object"
    ? raw.confidence as RawObject
    : {};

  return {
    name: cleanText(raw.name, "Untitled jacket", 80),
    category: "jacket",
    subtype: normalizeSubtype(raw.subtype ?? raw.type),
    primaryColor: normalizeColor(raw.primaryColor ?? raw.primary_color, "other"),
    secondaryColor: normalizeSecondaryColor(
      raw.secondaryColor ?? raw.secondary_color,
    ),
    materials: normalizeArray(raw.materials, JACKET_MATERIALS, {
      waterproof: "waterproof_shell",
      shell: "waterproof_shell",
      faux_leather: "leather",
      synthetic: "polyester",
      insulated: "synthetic_insulation",
    }) as JacketMaterial[],
    warmthRating: clampRating(raw.warmthRating ?? raw.warmth_rating, 2),
    rainRating: clampRating(raw.rainRating ?? raw.rain_rating, 2),
    windRating: clampRating(raw.windRating ?? raw.wind_rating, 2),
    formalityRating: clampRating(raw.formalityRating ?? raw.formality_rating, 1),
    fit: normalizeFromAllowed(raw.fit, JACKET_FITS, "regular", {
      standard: "regular",
      loose: "relaxed",
      boxy: "oversized",
      fitted: "slim",
    }) as JacketFit,
    styleTags: normalizeArray(raw.styleTags ?? raw.style_tags, JACKET_STYLE_TAGS, {
      smartcasual: "smart_casual",
      business_casual: "smart_casual",
      sport: "athletic",
      hiking: "outdoor",
      technical: "techwear",
    }) as JacketStyleTag[],
    weatherUse: normalizeArray(raw.weatherUse ?? raw.weather_use, JACKET_WEATHER_USES, {
      warm: "hot_weather",
      mild: "mild_weather",
      cool: "cool_weather",
      cold: "cold_weather",
      very_cold: "very_cold_weather",
      rain: "light_rain",
      waterproof: "heavy_rain",
      windy: "wind",
      winter: "snow",
      dry: "dry_weather",
    }) as JacketWeatherUse[],
    description: cleanText(
      raw.description,
      "Jacket details were estimated from the image.",
      240,
    ),
    confidence: {
      category: clampConfidence(confidenceRaw.category, 0.8),
      subtype: clampConfidence(confidenceRaw.subtype, 0.6),
      color: clampConfidence(confidenceRaw.color, 0.7),
      materials: clampConfidence(confidenceRaw.materials, 0.5),
      weatherRatings: clampConfidence(confidenceRaw.weatherRatings, 0.5),
      overall: clampConfidence(confidenceRaw.overall, 0.6),
    },
  };
}

export function parseJsonObject(text: string): RawObject {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: unknown = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The AI provider returned an invalid JSON object.");
  }

  return parsed as RawObject;
}
