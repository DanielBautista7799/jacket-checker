import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

const MODEL = "gemini-2.5-flash";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GEMINI_ATTEMPTS = 3;
const GEMINI_TIMEOUT_MS = 25_000;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_CATEGORIES = [
  "jacket",
  "top",
  "base_layer",
  "hoodie_sweater",
  "bottoms",
  "shoes",
  "accessory",
] as const;

const SUBTYPES_BY_CATEGORY = {
  jacket: [
    "windbreaker",
    "rain_shell",
    "rain_jacket",
    "hoodie",
    "bomber",
    "denim_jacket",
    "leather_jacket",
    "puffer",
    "fleece",
    "fleece_jacket",
    "varsity_jacket",
    "utility_jacket",
    "overcoat",
    "trench_coat",
    "heavy_coat",
    "other",
  ],
  top: [
    "t_shirt",
    "long_sleeve_shirt",
    "button_up_shirt",
    "polo",
    "tank_top",
    "overshirt",
    "jersey",
    "other",
  ],
  base_layer: [
    "thermal_shirt",
    "compression_shirt",
    "undershirt",
    "thermal_leggings",
    "compression_leggings",
    "other",
  ],
  hoodie_sweater: [
    "pullover_hoodie",
    "zip_hoodie",
    "crewneck_sweatshirt",
    "cardigan",
    "knit_sweater",
    "turtleneck",
    "quarter_zip",
    "other",
  ],
  bottoms: [
    "jeans",
    "cargos",
    "chinos",
    "joggers",
    "sweatpants",
    "trousers",
    "shorts",
    "other",
  ],
  shoes: [
    "sneakers",
    "high_top_sneakers",
    "running_shoes",
    "boots",
    "loafers",
    "dress_shoes",
    "sandals",
    "other",
  ],
  accessory: [
    "beanie",
    "hat",
    "scarf",
    "gloves",
    "umbrella",
    "bag",
    "belt",
    "sunglasses",
    "other",
  ],
} as const;

const ALL_SUBTYPES = [
  ...new Set(Object.values(SUBTYPES_BY_CATEGORY).flat()),
] as string[];

const ALLOWED_COLORS = [
  "black",
  "white",
  "grey",
  "gray",
  "navy",
  "blue",
  "light_blue",
  "brown",
  "tan",
  "beige",
  "cream",
  "green",
  "olive",
  "red",
  "burgundy",
  "orange",
  "yellow",
  "purple",
  "pink",
  "silver",
  "gold",
  "multicolor",
  "other",
  "none",
] as const;

const ALLOWED_FITS = [
  "slim",
  "regular",
  "relaxed",
  "oversized",
  "athletic",
  "tailored",
  "cropped",
  "unknown",
] as const;

const ALLOWED_MATERIALS = [
  "cotton",
  "polyester",
  "nylon",
  "wool",
  "leather",
  "denim",
  "fleece",
  "linen",
  "suede",
  "canvas",
  "down",
  "synthetic_insulation",
  "waterproof_shell",
  "other",
] as const;

const ALLOWED_STYLE_TAGS = [
  "streetwear",
  "minimal",
  "casual",
  "smart_casual",
  "athletic",
  "outdoor",
  "skater",
  "workwear",
  "vintage",
  "preppy",
  "techwear",
  "formal",
] as const;

const ALLOWED_WEATHER_USES = [
  "hot_weather",
  "mild_weather",
  "cool_weather",
  "cold_weather",
  "very_cold_weather",
  "light_rain",
  "heavy_rain",
  "wind",
  "snow",
  "dry_weather",
  "all_weather",
] as const;

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

type WardrobeCategory = (typeof ALLOWED_CATEGORIES)[number];
type WardrobeColor = (typeof ALLOWED_COLORS)[number];
type WardrobeFit = (typeof ALLOWED_FITS)[number];
type WardrobeMaterial = (typeof ALLOWED_MATERIALS)[number];
type WardrobeStyleTag = (typeof ALLOWED_STYLE_TAGS)[number];
type WardrobeWeatherUse = (typeof ALLOWED_WEATHER_USES)[number];

type RawObject = Record<string, unknown>;

interface RawAnalysis extends RawObject {
  name?: unknown;
  category?: unknown;
  subtype?: unknown;
  type?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
  materials?: unknown;
  warmthRating?: unknown;
  rainRating?: unknown;
  windRating?: unknown;
  formalityRating?: unknown;
  fit?: unknown;
  styleTags?: unknown;
  weatherUse?: unknown;
  description?: unknown;
  confidence?: unknown;
}

interface WardrobeAnalysis {
  name: string;
  category: WardrobeCategory;
  subtype: string;
  primaryColor: Exclude<WardrobeColor, "none">;
  secondaryColor: Exclude<WardrobeColor, "none"> | null;
  materials: WardrobeMaterial[];
  warmthRating: number;
  rainRating: number;
  windRating: number;
  formalityRating: number;
  fit: WardrobeFit;
  styleTags: WardrobeStyleTag[];
  weatherUse: WardrobeWeatherUse[];
  description: string;
  confidence: {
    category: number;
    subtype: number;
    color: number;
    materials: number;
    weatherRatings: number;
    overall: number;
  };
}

interface GeminiAttemptResult {
  ok: boolean;
  status: number;
  payload: RawObject;
  responseText: string | null;
  finishReason: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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

function cleanText(
  value: unknown,
  fallback: string,
  maximumLength: number,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maximumLength) : fallback;
}

function clampRating(value: unknown, fallback = 1): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(5, Math.max(1, Math.round(number)));
}

function clampConfidence(value: unknown, fallback = 0.5): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, number));
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return (
    typeof value === "string" &&
    allowedValues.includes(value as T[number])
  );
}

function normalizeCategory(value: unknown): WardrobeCategory {
  if (isAllowedValue(value, ALLOWED_CATEGORIES)) {
    return value;
  }

  const token = normalizeToken(value);
  const aliases: Record<string, WardrobeCategory> = {
    coat: "jacket",
    outerwear: "jacket",
    shirt: "top",
    tee: "top",
    thermal: "base_layer",
    base: "base_layer",
    hoodie: "hoodie_sweater",
    sweater: "hoodie_sweater",
    sweatshirt: "hoodie_sweater",
    pants: "bottoms",
    trousers: "bottoms",
    shoe: "shoes",
    footwear: "shoes",
    accessories: "accessory",
  };

  return aliases[token] || "jacket";
}

function normalizeSubtype(value: unknown, category: WardrobeCategory): string {
  const token = normalizeToken(value);
  const aliases: Record<WardrobeCategory, Record<string, string>> = {
    jacket: {
      shell: "rain_shell",
      shell_jacket: "rain_shell",
      raincoat: "rain_jacket",
      track_jacket: "windbreaker",
      jean_jacket: "denim_jacket",
      leather: "leather_jacket",
      down_jacket: "puffer",
      parka: "heavy_coat",
      wool_coat: "overcoat",
      varsity: "varsity_jacket",
      chore_jacket: "utility_jacket",
    },
    top: {
      tshirt: "t_shirt",
      tee: "t_shirt",
      long_sleeve: "long_sleeve_shirt",
      button_down: "button_up_shirt",
      button_up: "button_up_shirt",
      tank: "tank_top",
      shirt_jacket: "overshirt",
    },
    base_layer: {
      thermal_top: "thermal_shirt",
      compression_top: "compression_shirt",
      base_layer_top: "undershirt",
      thermal_bottoms: "thermal_leggings",
      compression_bottoms: "compression_leggings",
    },
    hoodie_sweater: {
      hoodie: "pullover_hoodie",
      pullover: "pullover_hoodie",
      zip_up_hoodie: "zip_hoodie",
      sweatshirt: "crewneck_sweatshirt",
      crewneck: "crewneck_sweatshirt",
      sweater: "knit_sweater",
      mock_neck: "turtleneck",
      quarterzip: "quarter_zip",
    },
    bottoms: {
      cargo: "cargos",
      cargo_pants: "cargos",
      denim: "jeans",
      sweat_pants: "sweatpants",
      dress_pants: "trousers",
      athletic_shorts: "shorts",
    },
    shoes: {
      sneaker: "sneakers",
      high_tops: "high_top_sneakers",
      trainers: "running_shoes",
      running_sneakers: "running_shoes",
      boot: "boots",
      loafer: "loafers",
      formal_shoes: "dress_shoes",
      slides: "sandals",
    },
    accessory: {
      cap: "hat",
      baseball_cap: "hat",
      winter_hat: "beanie",
      mittens: "gloves",
      backpack: "bag",
      tote: "bag",
      shades: "sunglasses",
    },
  };

  const normalized = aliases[category][token] || token;
  const allowedSubtypes = SUBTYPES_BY_CATEGORY[category] as readonly string[];

  return allowedSubtypes.includes(normalized) ? normalized : "other";
}

function normalizeColor(
  value: unknown,
  fallback: WardrobeColor,
): WardrobeColor {
  if (isAllowedValue(value, ALLOWED_COLORS)) {
    return value;
  }

  const token = normalizeToken(value);
  const aliases: Record<string, WardrobeColor> = {
    charcoal: "grey",
    silver_grey: "grey",
    off_white: "cream",
    ivory: "cream",
    khaki: "tan",
    maroon: "burgundy",
    forest_green: "green",
    army_green: "olive",
    sky_blue: "light_blue",
    teal: "blue",
    metallic_silver: "silver",
    metallic_gold: "gold",
  };

  return aliases[token] || fallback;
}

function normalizeFit(value: unknown): WardrobeFit {
  if (isAllowedValue(value, ALLOWED_FITS)) {
    return value;
  }

  const token = normalizeToken(value);
  const aliases: Record<string, WardrobeFit> = {
    fitted: "slim",
    standard: "regular",
    classic: "regular",
    loose: "relaxed",
    baggy: "oversized",
    boxy: "oversized",
    performance: "athletic",
  };

  return aliases[token] || "unknown";
}

function normalizeArray<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  aliases: Record<string, T[number]> = {},
  maximumItems = 6,
): T[number][] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((item) => {
      if (isAllowedValue(item, allowedValues)) {
        return item;
      }

      const token = normalizeToken(item);
      return aliases[token] || null;
    })
    .filter((item): item is T[number] => item !== null);

  return [...new Set(normalized)].slice(0, maximumItems);
}

function normalizeConfidence(value: unknown): WardrobeAnalysis["confidence"] {
  const confidence =
    value && typeof value === "object" ? (value as RawObject) : {};

  return {
    category: clampConfidence(confidence.category, 0.5),
    subtype: clampConfidence(confidence.subtype ?? confidence.type, 0.5),
    color: clampConfidence(confidence.color, 0.5),
    materials: clampConfidence(confidence.materials, 0.4),
    weatherRatings: clampConfidence(
      confidence.weatherRatings ?? confidence.weather_ratings,
      0.4,
    ),
    overall: clampConfidence(confidence.overall, 0.5),
  };
}

function normalizeAnalysis(raw: RawAnalysis): WardrobeAnalysis {
  const category = normalizeCategory(raw.category);
  const primaryColor = normalizeColor(raw.primaryColor, "other");
  const secondaryColor = normalizeColor(raw.secondaryColor, "none");

  const materialAliases: Record<string, WardrobeMaterial> = {
    synthetic: "polyester",
    poly: "polyester",
    polyamide: "nylon",
    faux_leather: "leather",
    jean: "denim",
    wool_blend: "wool",
    cotton_blend: "cotton",
    down_fill: "down",
    synthetic_fill: "synthetic_insulation",
    shell: "waterproof_shell",
    waterproof: "waterproof_shell",
  };

  const styleAliases: Record<string, WardrobeStyleTag> = {
    urban: "streetwear",
    sporty: "athletic",
    sportswear: "athletic",
    smart: "smart_casual",
    business_casual: "smart_casual",
    retro: "vintage",
    gorpcore: "outdoor",
    functional: "techwear",
    work: "workwear",
  };

  const weatherAliases: Record<string, WardrobeWeatherUse> = {
    hot: "hot_weather",
    warm_weather: "hot_weather",
    mild: "mild_weather",
    cool: "cool_weather",
    cold: "cold_weather",
    winter: "very_cold_weather",
    very_cold: "very_cold_weather",
    rain: "light_rain",
    rainy: "light_rain",
    heavy_rainfall: "heavy_rain",
    windy: "wind",
    dry: "dry_weather",
    versatile: "all_weather",
  };

  return {
    name: cleanText(raw.name, "Wardrobe item", 80),
    category,
    subtype: normalizeSubtype(raw.subtype ?? raw.type, category),
    primaryColor: primaryColor === "none" ? "other" : primaryColor,
    secondaryColor:
      secondaryColor === "none" || secondaryColor === primaryColor
        ? null
        : secondaryColor,
    materials: normalizeArray(
      raw.materials,
      ALLOWED_MATERIALS,
      materialAliases,
    ),
    warmthRating: clampRating(raw.warmthRating, 1),
    rainRating: clampRating(raw.rainRating, 1),
    windRating: clampRating(raw.windRating, 1),
    formalityRating: clampRating(raw.formalityRating, 1),
    fit: normalizeFit(raw.fit),
    styleTags: normalizeArray(
      raw.styleTags,
      ALLOWED_STYLE_TAGS,
      styleAliases,
    ),
    weatherUse: normalizeArray(
      raw.weatherUse,
      ALLOWED_WEATHER_USES,
      weatherAliases,
    ),
    description: cleanText(raw.description, "", 240),
    confidence: normalizeConfidence(raw.confidence),
  };
}

function estimateBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function isValidBase64(value: string): boolean {
  return value.length > 0 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function buildPrompt(categoryHint: WardrobeCategory | null): string {
  const hintText = categoryHint
    ? `The user selected ${categoryHint} as a possible category. Treat it only as a hint and correct it when the image clearly shows another category.`
    : "No category hint was provided.";

  return `
Analyze the single primary wardrobe item visible in this image.

Supported categories and valid subtypes:
- jacket: ${SUBTYPES_BY_CATEGORY.jacket.join(", ")}
- top: ${SUBTYPES_BY_CATEGORY.top.join(", ")}
- base_layer: ${SUBTYPES_BY_CATEGORY.base_layer.join(", ")}
- hoodie_sweater: ${SUBTYPES_BY_CATEGORY.hoodie_sweater.join(", ")}
- bottoms: ${SUBTYPES_BY_CATEGORY.bottoms.join(", ")}
- shoes: ${SUBTYPES_BY_CATEGORY.shoes.join(", ")}
- accessory: ${SUBTYPES_BY_CATEGORY.accessory.join(", ")}

${hintText}

Rules:
- Analyze only the most prominent wardrobe item.
- Never identify, describe, or infer traits about a person.
- Never guess a brand or exact product model.
- Choose exactly one supported category.
- Choose a subtype that belongs to the selected category; use other when uncertain.
- Use only values allowed by the response schema.
- Only include a material when it is visually plausible; use other when uncertain.
- Estimate warmth, rain protection, wind protection, and formality conservatively.
- For items such as jewelry that are not supported, use accessory/other.
- Keep the name under 60 characters and the description under 160 characters.
- Complete every required field.
- Confidence values must be between 0 and 1.

Rating scales:
Warmth: 1 minimal, 2 light, 3 moderate, 4 warm, 5 heavy winter.
Rain: 1 none, 2 slight, 3 light rain, 4 strong resistance, 5 heavy-rain design.
Wind: 1 minimal, 2 slight, 3 moderate, 4 strong, 5 high-wind design.
Formality: 1 very casual, 2 casual, 3 flexible, 4 dressy, 5 formal.
`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string", enum: ALLOWED_CATEGORIES },
    subtype: { type: "string", enum: ALL_SUBTYPES },
    primaryColor: {
      type: "string",
      enum: ALLOWED_COLORS.filter((color) => color !== "none"),
    },
    secondaryColor: { type: "string", enum: ALLOWED_COLORS },
    materials: {
      type: "array",
      items: { type: "string", enum: ALLOWED_MATERIALS },
      maxItems: 6,
    },
    warmthRating: { type: "integer", minimum: 1, maximum: 5 },
    rainRating: { type: "integer", minimum: 1, maximum: 5 },
    windRating: { type: "integer", minimum: 1, maximum: 5 },
    formalityRating: { type: "integer", minimum: 1, maximum: 5 },
    fit: { type: "string", enum: ALLOWED_FITS },
    styleTags: {
      type: "array",
      items: { type: "string", enum: ALLOWED_STYLE_TAGS },
      maxItems: 6,
    },
    weatherUse: {
      type: "array",
      items: { type: "string", enum: ALLOWED_WEATHER_USES },
      maxItems: 6,
    },
    description: { type: "string" },
    confidence: {
      type: "object",
      properties: {
        category: { type: "number", minimum: 0, maximum: 1 },
        subtype: { type: "number", minimum: 0, maximum: 1 },
        color: { type: "number", minimum: 0, maximum: 1 },
        materials: { type: "number", minimum: 0, maximum: 1 },
        weatherRatings: { type: "number", minimum: 0, maximum: 1 },
        overall: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "category",
        "subtype",
        "color",
        "materials",
        "weatherRatings",
        "overall",
      ],
    },
  },
  required: [
    "name",
    "category",
    "subtype",
    "primaryColor",
    "secondaryColor",
    "materials",
    "warmthRating",
    "rainRating",
    "windRating",
    "formalityRating",
    "fit",
    "styleTags",
    "weatherUse",
    "description",
    "confidence",
  ],
};

function extractResponseText(payload: RawObject): string | null {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const firstCandidate = candidates[0] as RawObject | undefined;
  const content = firstCandidate?.content as RawObject | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];

  for (const part of parts) {
    if (
      part &&
      typeof part === "object" &&
      typeof (part as RawObject).text === "string"
    ) {
      return (part as RawObject).text as string;
    }
  }

  return null;
}

function parseGeminiJson(text: string): RawAnalysis {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: unknown = JSON.parse(withoutFence);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini returned an invalid analysis object.");
  }

  return parsed as RawAnalysis;
}

async function performGeminiRequest({
  apiKey,
  imageBase64,
  mimeType,
  categoryHint,
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  categoryHint: WardrobeCategory | null;
}): Promise<GeminiAttemptResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: buildPrompt(categoryHint),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    const rawPayload = await response.text();
    let payload: RawObject = {};

    try {
      payload = rawPayload ? (JSON.parse(rawPayload) as RawObject) : {};
    } catch {
      payload = {};
    }

    const candidates = Array.isArray(payload.candidates)
      ? payload.candidates
      : [];
    const firstCandidate = candidates[0] as RawObject | undefined;

    return {
      ok: response.ok,
      status: response.status,
      payload,
      responseText: response.ok ? extractResponseText(payload) : null,
      finishReason:
        typeof firstCandidate?.finishReason === "string"
          ? firstCandidate.finishReason
          : null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function analyzeWithGemini({
  apiKey,
  imageBase64,
  mimeType,
  categoryHint,
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  categoryHint: WardrobeCategory | null;
}): Promise<
  | { analysis: WardrobeAnalysis; error: null; status: 200 }
  | { analysis: null; error: string; status: number }
> {
  let lastStatus = 502;
  let temporaryFailure = false;

  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
    try {
      const result = await performGeminiRequest({
        apiKey,
        imageBase64,
        mimeType,
        categoryHint,
      });

      lastStatus = result.status;

      if (!result.ok) {
        const errorPayload = result.payload.error as RawObject | undefined;
        const errorCode = Number(errorPayload?.code) || result.status;
        const errorMessage =
          typeof errorPayload?.message === "string"
            ? errorPayload.message
            : "Gemini request failed.";

        temporaryFailure = RETRYABLE_STATUS_CODES.has(errorCode);
        console.error(
          `Gemini wardrobe analysis attempt ${attempt} failed with status ${result.status}: ${errorMessage.slice(0, 240)}`,
        );

        if (temporaryFailure && attempt < MAX_GEMINI_ATTEMPTS) {
          await sleep(700 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250));
          continue;
        }

        break;
      }

      if (!result.responseText) {
        console.error(
          `Gemini wardrobe analysis attempt ${attempt} returned no JSON text. Finish reason: ${result.finishReason || "unknown"}.`,
        );

        if (attempt < MAX_GEMINI_ATTEMPTS) {
          await sleep(500 * attempt);
          continue;
        }

        break;
      }

      try {
        const parsed = parseGeminiJson(result.responseText);
        return {
          analysis: normalizeAnalysis(parsed),
          error: null,
          status: 200,
        };
      } catch (error) {
        console.error(
          `Gemini wardrobe analysis attempt ${attempt} returned invalid structured JSON:`,
          error instanceof Error ? error.message : "Unknown parse error",
        );

        if (attempt < MAX_GEMINI_ATTEMPTS) {
          await sleep(500 * attempt);
          continue;
        }
      }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      temporaryFailure = true;
      lastStatus = timedOut ? 504 : 502;

      console.error(
        `Gemini wardrobe analysis attempt ${attempt} threw an error:`,
        timedOut
          ? "Request timed out."
          : error instanceof Error
            ? error.message
            : "Unknown request error",
      );

      if (attempt < MAX_GEMINI_ATTEMPTS) {
        await sleep(700 * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  return {
    analysis: null,
    error: temporaryFailure
      ? "The AI service is busy or unavailable right now. Try again shortly, or complete the wardrobe item manually."
      : "The AI could not complete this analysis. Retry with a clearer photo, or complete the wardrobe item manually.",
    status: temporaryFailure ? 503 : Math.max(422, lastStatus),
  };
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          success: false,
          error: "You must be signed in to analyze a wardrobe item.",
        },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment is not configured.");
    }

    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          success: false,
          error: "Your session is invalid or expired.",
        },
        401,
      );
    }

    let body: RawObject;

    try {
      body = (await request.json()) as RawObject;
    } catch {
      return jsonResponse(
        { success: false, error: "The request body is invalid." },
        400,
      );
    }

    const imageBase64 = body.imageBase64;
    const mimeType = body.mimeType;
    const categoryHint = isAllowedValue(
      body.categoryHint,
      ALLOWED_CATEGORIES,
    )
      ? body.categoryHint
      : null;

    if (typeof imageBase64 !== "string" || !imageBase64) {
      return jsonResponse(
        { success: false, error: "No image data was provided." },
        400,
      );
    }

    if (
      typeof mimeType !== "string" ||
      !ALLOWED_MIME_TYPES.has(mimeType)
    ) {
      return jsonResponse(
        { success: false, error: "Use a JPG, PNG, or WebP image." },
        400,
      );
    }

    if (!isValidBase64(imageBase64)) {
      return jsonResponse(
        { success: false, error: "The supplied image data is invalid." },
        400,
      );
    }

    if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
      return jsonResponse(
        { success: false, error: "The image must be smaller than 5 MB." },
        413,
      );
    }

    const result = await analyzeWithGemini({
      apiKey: geminiApiKey,
      imageBase64,
      mimeType,
      categoryHint,
    });

    if (!result.analysis) {
      return jsonResponse(
        {
          success: false,
          error: result.error,
        },
        result.status,
      );
    }

    return jsonResponse({
      success: true,
      provider: "gemini",
      model: MODEL,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error(
      "Analyze wardrobe item failure:",
      error instanceof Error ? error.message : "Unknown function error",
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Automatic analysis is unavailable right now. You can still complete the wardrobe item manually.",
      },
      500,
    );
  }
});
