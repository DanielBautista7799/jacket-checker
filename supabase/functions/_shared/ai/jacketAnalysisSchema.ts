export const JACKET_ANALYSIS_VERSION = "phase10-v1";

export const JACKET_SUBTYPES = [
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
] as const;

export const JACKET_COLORS = [
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

export const JACKET_FITS = [
  "slim",
  "regular",
  "relaxed",
  "oversized",
  "athletic",
  "tailored",
  "cropped",
  "unknown",
] as const;

export const JACKET_MATERIALS = [
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

export const JACKET_STYLE_TAGS = [
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

export const JACKET_WEATHER_USES = [
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

export type JacketSubtype = (typeof JACKET_SUBTYPES)[number];
export type JacketColor = Exclude<(typeof JACKET_COLORS)[number], "none">;
export type JacketFit = (typeof JACKET_FITS)[number];
export type JacketMaterial = (typeof JACKET_MATERIALS)[number];
export type JacketStyleTag = (typeof JACKET_STYLE_TAGS)[number];
export type JacketWeatherUse = (typeof JACKET_WEATHER_USES)[number];

export interface JacketConfidence {
  category: number;
  subtype: number;
  color: number;
  materials: number;
  weatherRatings: number;
  overall: number;
}

export interface NormalizedJacketAnalysis {
  name: string;
  category: "jacket";
  subtype: JacketSubtype;
  primaryColor: JacketColor;
  secondaryColor: JacketColor | null;
  materials: JacketMaterial[];
  warmthRating: number;
  rainRating: number;
  windRating: number;
  formalityRating: number;
  fit: JacketFit;
  styleTags: JacketStyleTag[];
  weatherUse: JacketWeatherUse[];
  description: string;
  confidence: JacketConfidence;
}

export interface JacketAnalysisProviderResult {
  analysis: NormalizedJacketAnalysis;
  provider: string;
  model: string;
  analysisVersion: string;
  rawResponse: unknown;
}

export interface JacketAnalysisProviderInput {
  imageBase64: string;
  mimeType: string;
  model?: string | null;
}

export interface JacketAnalysisProvider {
  id: string;
  analyze(input: JacketAnalysisProviderInput): Promise<JacketAnalysisProviderResult>;
}

// Keep this schema inside the conservative OpenAPI subset accepted by the
// legacy generateContent responseSchema field. The server-side normalizer
// already discards unknown fields, so additionalProperties is unnecessary.
export const JACKET_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string", enum: ["jacket"] },
    subtype: { type: "string", enum: JACKET_SUBTYPES },
    primaryColor: {
      type: "string",
      enum: JACKET_COLORS.filter((color) => color !== "none"),
    },
    secondaryColor: { type: "string", enum: JACKET_COLORS },
    materials: {
      type: "array",
      items: { type: "string", enum: JACKET_MATERIALS },
      maxItems: 6,
    },
    warmthRating: { type: "integer", minimum: 1, maximum: 5 },
    rainRating: { type: "integer", minimum: 1, maximum: 5 },
    windRating: { type: "integer", minimum: 1, maximum: 5 },
    formalityRating: { type: "integer", minimum: 1, maximum: 5 },
    fit: { type: "string", enum: JACKET_FITS },
    styleTags: {
      type: "array",
      items: { type: "string", enum: JACKET_STYLE_TAGS },
      maxItems: 6,
    },
    weatherUse: {
      type: "array",
      items: { type: "string", enum: JACKET_WEATHER_USES },
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
} as const;

export function buildJacketAnalysisPrompt(): string {
  return `Analyze only the jacket shown in the image. If the image is not clearly a jacket or outerwear item, still return the required JSON but use subtype "other" and low confidence. Never classify it as a shirt, pants, shoes, or an accessory.

Return one JSON object that follows the supplied schema exactly.

Use conservative visual estimates:
- Warmth 1 = extremely light, 5 = severe-cold insulation.
- Rain 1 = absorbs water, 5 = purpose-built waterproof shell.
- Wind 1 = minimal wind resistance, 5 = high-wind protection.
- Formality 1 = very casual, 5 = formal outerwear.
- Use "none" for secondaryColor when no clear second color is visible.
- Keep description under 240 characters and describe only visible or strongly supported jacket traits.
- Do not invent a brand, exact material technology, or waterproof rating.
- Category must always be "jacket".`;
}
