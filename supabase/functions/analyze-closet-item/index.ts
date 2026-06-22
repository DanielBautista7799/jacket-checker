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

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_TYPES = [
  "windbreaker",
  "rain_shell",
  "hoodie",
  "denim_jacket",
  "bomber",
  "leather_jacket",
  "puffer",
  "fleece",
  "overcoat",
  "heavy_coat",
  "other",
] as const;

const ALLOWED_COLORS = [
  "black",
  "white",
  "grey",
  "navy",
  "blue",
  "red",
  "green",
  "olive",
  "brown",
  "cream",
  "beige",
  "yellow",
  "orange",
  "purple",
  "pink",
  "multicolor",
  "other",
  "none",
] as const;

const ALLOWED_STYLE_TAGS = [
  "streetwear",
  "minimal",
  "athletic",
  "smart_casual",
  "techwear",
  "vintage",
  "skater",
  "outdoor",
] as const;

const ALLOWED_WEATHER_USES = [
  "mild_weather",
  "cool_weather",
  "cold_weather",
  "very_cold_weather",
  "light_rain",
  "heavy_rain",
  "wind",
  "dry_weather",
] as const;

type JacketType = (typeof ALLOWED_TYPES)[number];
type JacketColor = (typeof ALLOWED_COLORS)[number];
type StyleTag = (typeof ALLOWED_STYLE_TAGS)[number];
type WeatherUse = (typeof ALLOWED_WEATHER_USES)[number];

interface RawAnalysis {
  name?: unknown;
  category?: unknown;
  type?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
  warmthRating?: unknown;
  rainRating?: unknown;
  windRating?: unknown;
  formalityRating?: unknown;
  styleTags?: unknown;
  description?: unknown;
  weatherUse?: unknown;
  confidence?: {
    type?: unknown;
    color?: unknown;
    weatherRatings?: unknown;
  };
}

interface ClosetAnalysis {
  name: string;
  category: "jacket";
  type: JacketType;
  primaryColor: Exclude<JacketColor, "none">;
  secondaryColor: Exclude<JacketColor, "none"> | null;
  warmthRating: number;
  rainRating: number;
  windRating: number;
  formalityRating: number;
  styleTags: StyleTag[];
  description: string;
  weatherUse: WeatherUse[];
  confidence: {
    type: number;
    color: number;
    weatherRatings: number;
  };
}

interface GeminiAttemptResult {
  ok: boolean;
  status: number;
  payload: any;
  responseText: string | null;
  finishReason: string | null;
}

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: JSON_HEADERS,
    },
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function clampInteger(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    5,
    Math.max(1, Math.round(parsed)),
  );
}

function clampConfidence(
  value: unknown,
  fallback = 0.5,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    1,
    Math.max(0, parsed),
  );
}

function cleanText(
  value: unknown,
  fallback: string,
  maximumLength: number,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(
    0,
    maximumLength,
  );
}

function isAllowedValue<
  T extends readonly string[],
>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return (
    typeof value === "string" &&
    allowed.includes(
      value as T[number],
    )
  );
}

function normalizeType(
  value: unknown,
): JacketType {
  if (
    isAllowedValue(
      value,
      ALLOWED_TYPES,
    )
  ) {
    return value;
  }

  const aliases: Record<
    string,
    JacketType
  > = {
    "track jacket": "windbreaker",
    "shell jacket": "rain_shell",
    "rain jacket": "rain_shell",
    denim: "denim_jacket",
    "jean jacket": "denim_jacket",
    "bomber jacket": "bomber",
    leather: "leather_jacket",
    "puffer jacket": "puffer",
    "down jacket": "puffer",
    "winter coat": "heavy_coat",
    parka: "heavy_coat",
    "wool coat": "overcoat",
    cardigan: "other",
    sweater: "other",
  };

  if (typeof value === "string") {
    return (
      aliases[
        value.toLowerCase().trim()
      ] || "other"
    );
  }

  return "other";
}

function normalizeColor(
  value: unknown,
  fallback: JacketColor,
): JacketColor {
  if (
    isAllowedValue(
      value,
      ALLOWED_COLORS,
    )
  ) {
    return value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .toLowerCase()
    .trim();

  const aliases: Record<
    string,
    JacketColor
  > = {
    charcoal: "grey",
    gray: "grey",
    silver: "grey",
    "off-white": "cream",
    ivory: "cream",
    tan: "beige",
    khaki: "beige",
    burgundy: "red",
    maroon: "red",
    "forest green": "green",
    "dark green": "green",
    "army green": "olive",
    teal: "blue",
  };

  return (
    aliases[normalized] || fallback
  );
}

function normalizeTags(
  value: unknown,
): StyleTag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const aliases: Record<
    string,
    StyleTag
  > = {
    urban: "streetwear",
    sportswear: "athletic",
    sporty: "athletic",
    retro: "vintage",
    gorpcore: "outdoor",
    functional: "techwear",
    "business casual":
      "smart_casual",
    "smart casual": "smart_casual",
  };

  const normalized = value
    .map((tag) => {
      if (
        isAllowedValue(
          tag,
          ALLOWED_STYLE_TAGS,
        )
      ) {
        return tag;
      }

      if (typeof tag === "string") {
        return (
          aliases[
            tag.toLowerCase().trim()
          ] || null
        );
      }

      return null;
    })
    .filter(
      (tag): tag is StyleTag =>
        tag !== null,
    );

  return [
    ...new Set(normalized),
  ].slice(0, 5);
}

function normalizeWeatherUse(
  value: unknown,
): WeatherUse[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const aliases: Record<
    string,
    WeatherUse
  > = {
    mild: "mild_weather",
    cool: "cool_weather",
    cold: "cold_weather",
    winter: "very_cold_weather",
    rain: "light_rain",
    "light rain": "light_rain",
    "heavy rain": "heavy_rain",
    windy: "wind",
    dry: "dry_weather",
  };

  const normalized = value
    .map((weatherUse) => {
      if (
        isAllowedValue(
          weatherUse,
          ALLOWED_WEATHER_USES,
        )
      ) {
        return weatherUse;
      }

      if (
        typeof weatherUse ===
        "string"
      ) {
        return (
          aliases[
            weatherUse
              .toLowerCase()
              .trim()
          ] || null
        );
      }

      return null;
    })
    .filter(
      (
        item,
      ): item is WeatherUse =>
        item !== null,
    );

  return [
    ...new Set(normalized),
  ].slice(0, 5);
}

function normalizeAnalysis(
  raw: RawAnalysis,
): ClosetAnalysis {
  const primaryColor =
    normalizeColor(
      raw.primaryColor,
      "other",
    );

  const secondaryColor =
    normalizeColor(
      raw.secondaryColor,
      "none",
    );

  return {
    name: cleanText(
      raw.name,
      "Jacket",
      80,
    ),

    category: "jacket",

    type: normalizeType(raw.type),

    primaryColor:
      primaryColor === "none"
        ? "other"
        : primaryColor,

    secondaryColor:
      secondaryColor === "none"
        ? null
        : secondaryColor,

    warmthRating: clampInteger(
      raw.warmthRating,
      3,
    ),

    rainRating: clampInteger(
      raw.rainRating,
      2,
    ),

    windRating: clampInteger(
      raw.windRating,
      2,
    ),

    formalityRating: clampInteger(
      raw.formalityRating,
      1,
    ),

    styleTags: normalizeTags(
      raw.styleTags,
    ),

    description: cleanText(
      raw.description,
      "Jacket detected from uploaded image.",
      240,
    ),

    weatherUse:
      normalizeWeatherUse(
        raw.weatherUse,
      ),

    confidence: {
      type: clampConfidence(
        raw.confidence?.type,
      ),

      color: clampConfidence(
        raw.confidence?.color,
      ),

      weatherRatings:
        clampConfidence(
          raw.confidence
            ?.weatherRatings,
          0.4,
        ),
    },
  };
}

function estimateBase64Bytes(
  base64: string,
): number {
  const padding =
    base64.endsWith("==")
      ? 2
      : base64.endsWith("=")
        ? 1
        : 0;

  return (
    Math.floor(
      (base64.length * 3) / 4,
    ) - padding
  );
}

function buildPrompt(): string {
  return `
Analyze the primary jacket, coat, hoodie, fleece, cardigan, sweater, or outerwear item visible in this image.

Return a concise JSON object matching the supplied schema.

Rules:
- Analyze only the clothing item.
- Never identify or describe a person.
- Do not guess a brand.
- Do not claim exact materials unless clearly visible.
- Estimate weather protection conservatively.
- Use type "other" for cardigans, sweaters, or unsupported outerwear.
- Keep the name under 60 characters.
- Keep the description under 160 characters.
- Use only schema-approved values.
- Confidence values must be between 0 and 1.
- Complete every required JSON field.
- Keep the complete response concise.

Warmth:
1 minimal
2 light
3 moderate
4 warm
5 heavy winter

Rain:
1 none
2 slight
3 light rain
4 strong resistance
5 heavy rain design

Wind:
1 minimal
2 slight
3 moderate
4 strong
5 high wind design

Formality:
1 very casual
2 casual
3 flexible
4 dressy
5 formal
`;
}

const RESPONSE_SCHEMA = {
  type: "object",

  properties: {
    name: {
      type: "string",
    },

    category: {
      type: "string",
      enum: ["jacket"],
    },

    type: {
      type: "string",
      enum: ALLOWED_TYPES,
    },

    primaryColor: {
      type: "string",
      enum: ALLOWED_COLORS.filter(
        (color) => color !== "none",
      ),
    },

    secondaryColor: {
      type: "string",
      enum: ALLOWED_COLORS,
    },

    warmthRating: {
      type: "integer",
      minimum: 1,
      maximum: 5,
    },

    rainRating: {
      type: "integer",
      minimum: 1,
      maximum: 5,
    },

    windRating: {
      type: "integer",
      minimum: 1,
      maximum: 5,
    },

    formalityRating: {
      type: "integer",
      minimum: 1,
      maximum: 5,
    },

    styleTags: {
      type: "array",

      items: {
        type: "string",
        enum: ALLOWED_STYLE_TAGS,
      },

      maxItems: 5,
    },

    description: {
      type: "string",
    },

    weatherUse: {
      type: "array",

      items: {
        type: "string",
        enum: ALLOWED_WEATHER_USES,
      },

      maxItems: 5,
    },

    confidence: {
      type: "object",

      properties: {
        type: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },

        color: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },

        weatherRatings: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },
      },

      required: [
        "type",
        "color",
        "weatherRatings",
      ],
    },
  },

  required: [
    "name",
    "category",
    "type",
    "primaryColor",
    "secondaryColor",
    "warmthRating",
    "rainRating",
    "windRating",
    "formalityRating",
    "styleTags",
    "description",
    "weatherUse",
    "confidence",
  ],
};

function isRetryableStatus(
  status: number,
): boolean {
  return [
    429,
    500,
    502,
    503,
    504,
  ].includes(status);
}

function extractResponseText(
  payload: any,
): string | null {
  const parts =
    payload?.candidates?.[0]
      ?.content?.parts;

  if (!Array.isArray(parts)) {
    return null;
  }

  const combined = parts
    .map((part) =>
      typeof part?.text === "string"
        ? part.text
        : "",
    )
    .join("")
    .trim();

  return combined || null;
}

function cleanJsonText(
  value: string,
): string {
  let cleaned = value.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(
        /^```(?:json)?\s*/i,
        "",
      )
      .replace(/\s*```$/, "");
  }

  const objectStart =
    cleaned.indexOf("{");

  const objectEnd =
    cleaned.lastIndexOf("}");

  if (
    objectStart >= 0 &&
    objectEnd > objectStart
  ) {
    cleaned = cleaned.slice(
      objectStart,
      objectEnd + 1,
    );
  }

  return cleaned.trim();
}

function parseGeminiJson(
  responseText: string,
): RawAnalysis | null {
  try {
    return JSON.parse(
      cleanJsonText(responseText),
    ) as RawAnalysis;
  } catch {
    return null;
  }
}

async function performGeminiRequest({
  apiKey,
  imageBase64,
  mimeType,
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
}): Promise<GeminiAttemptResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          apiKey,
      },

      body: JSON.stringify({
        contents: [
          {
            role: "user",

            parts: [
              {
                inline_data: {
                  mime_type:
                    mimeType,

                  data: imageBase64,
                },
              },

              {
                text: buildPrompt(),
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.1,

          maxOutputTokens: 2048,

          responseMimeType:
            "application/json",

          responseSchema:
            RESPONSE_SCHEMA,
        },
      }),
    },
  );

  const rawPayload =
    await response.text();

  let payload: any = {};

  try {
    payload = rawPayload
      ? JSON.parse(rawPayload)
      : {};
  } catch {
    payload = {
      rawText: rawPayload,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,

    responseText:
      response.ok
        ? extractResponseText(
            payload,
          )
        : null,

    finishReason:
      payload?.candidates?.[0]
        ?.finishReason || null,
  };
}

async function analyzeWithGemini({
  apiKey,
  imageBase64,
  mimeType,
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
}): Promise<
  | {
      analysis: ClosetAnalysis;
      error: null;
      status: 200;
    }
  | {
      analysis: null;
      error: string;
      status: number;
    }
> {
  let lastStatus = 502;
  let lastError =
    "Automatic analysis is unavailable right now.";

  for (
    let attempt = 1;
    attempt <= MAX_GEMINI_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const result =
        await performGeminiRequest({
          apiKey,
          imageBase64,
          mimeType,
        });

      lastStatus = result.status;

      if (!result.ok) {
        console.error(
          `Gemini attempt ${attempt} failed:`,
          result.payload,
        );

        const errorCode =
          result.payload?.error?.code;

        const errorMessage =
          result.payload?.error
            ?.message;

        lastError =
          typeof errorMessage ===
          "string"
            ? errorMessage
            : "Gemini request failed.";

        if (
          attempt <
            MAX_GEMINI_ATTEMPTS &&
          isRetryableStatus(
            errorCode ||
              result.status,
          )
        ) {
          const delay =
            700 *
              2 ** (attempt - 1) +
            Math.floor(
              Math.random() * 250,
            );

          await sleep(delay);
          continue;
        }

        break;
      }

      if (!result.responseText) {
        console.error(
          `Gemini attempt ${attempt} returned no text:`,
          result.payload,
        );

        lastError =
          "Gemini returned no analysis.";

        if (
          attempt <
          MAX_GEMINI_ATTEMPTS
        ) {
          await sleep(
            500 * attempt,
          );

          continue;
        }

        break;
      }

      const parsed =
        parseGeminiJson(
          result.responseText,
        );

      if (!parsed) {
        console.error(
          `Gemini attempt ${attempt} returned invalid JSON.`,
          {
            finishReason:
              result.finishReason,

            responseText:
              result.responseText,
          },
        );

        lastError =
          "Gemini returned incomplete JSON.";

        if (
          attempt <
          MAX_GEMINI_ATTEMPTS
        ) {
          await sleep(
            500 * attempt,
          );

          continue;
        }

        break;
      }

      return {
        analysis:
          normalizeAnalysis(parsed),

        error: null,

        status: 200,
      };
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} threw an error:`,
        error,
      );

      lastError =
        error instanceof Error
          ? error.message
          : "Gemini request failed.";

      if (
        attempt <
        MAX_GEMINI_ATTEMPTS
      ) {
        await sleep(
          700 *
            2 ** (attempt - 1),
        );

        continue;
      }
    }
  }

  const temporaryFailure =
    lastStatus === 429 ||
    lastStatus === 503 ||
    lastStatus === 504;

  return {
    analysis: null,

    error: temporaryFailure
      ? "The AI service is busy right now. Please wait a moment and try again, or enter the jacket manually."
      : "The AI could not complete the analysis. Please retry or enter the jacket manually.",

    status: temporaryFailure
      ? 503
      : 422,
  };
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    if (
      request.method === "OPTIONS"
    ) {
      return new Response("ok", {
        headers: CORS_HEADERS,
      });
    }

    if (
      request.method !== "POST"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Method not allowed.",
        },
        405,
      );
    }

    try {
      const authorization =
        request.headers.get(
          "Authorization",
        );

      if (!authorization) {
        return jsonResponse(
          {
            success: false,

            error:
              "You must be signed in to analyze a jacket.",
          },
          401,
        );
      }

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL",
        );

      const supabaseAnonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY",
        );

      const geminiApiKey =
        Deno.env.get(
          "GEMINI_API_KEY",
        );

      if (
        !supabaseUrl ||
        !supabaseAnonKey
      ) {
        throw new Error(
          "Supabase environment is not configured.",
        );
      }

      if (!geminiApiKey) {
        throw new Error(
          "Gemini API key is not configured.",
        );
      }

      const supabase =
        createClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization:
                  authorization,
              },
            },

            auth: {
              persistSession: false,
            },
          },
        );

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              "Your session is invalid or expired.",
          },
          401,
        );
      }

      let body: any;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            success: false,

            error:
              "The request body is invalid.",
          },
          400,
        );
      }

      const imageBase64 =
        body?.imageBase64;

      const mimeType =
        body?.mimeType;

      if (
        typeof imageBase64 !==
          "string" ||
        !imageBase64
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              "No image data was provided.",
          },
          400,
        );
      }

      if (
        typeof mimeType !==
          "string" ||
        !ALLOWED_MIME_TYPES.has(
          mimeType,
        )
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              "Use a JPG, PNG, or WebP image.",
          },
          400,
        );
      }

      const estimatedBytes =
        estimateBase64Bytes(
          imageBase64,
        );

      if (
        estimatedBytes >
        MAX_IMAGE_BYTES
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              "The image must be smaller than 5 MB.",
          },
          413,
        );
      }

      const result =
        await analyzeWithGemini({
          apiKey:
            geminiApiKey,

          imageBase64,

          mimeType,
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

        analysis:
          result.analysis,
      });
    } catch (error) {
      console.error(
        "Analyze closet item failure:",
        error,
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Automatic analysis is unavailable right now. You can still enter the jacket manually.",
        },
        500,
      );
    }
  },
);
