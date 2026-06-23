function clean(value, fallback = "unknown") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return normalized || fallback;
}

function cleanList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => clean(entry, "")).filter(Boolean))];
}

function ratingLabel(value, labels) {
  const number = Math.min(5, Math.max(1, Math.round(Number(value) || 1)));
  return labels[number - 1];
}

export function buildCanonicalJacketDescriptor(item = {}) {
  const name = clean(item.name, "unnamed jacket");
  const subtype = clean(item.subtype || item.type, "jacket");
  const primaryColor = clean(
    item.primary_color || item.primaryColor || item.color,
    "unknown color"
  );
  const secondaryColor = clean(
    item.secondary_color || item.secondaryColor,
    ""
  );
  const materials = cleanList(item.materials);
  const fit = clean(item.fit, "regular");
  const styleTags = cleanList(item.style_tags || item.styleTags);
  const weatherUse = cleanList(item.weather_use || item.weatherUse);
  const description = clean(item.description, "");

  const warmth = ratingLabel(
    item.warmth_rating || item.warmthRating,
    [
      "very light warmth",
      "light warmth",
      "medium warmth",
      "high warmth",
      "severe-cold warmth",
    ]
  );
  const rain = ratingLabel(item.rain_rating || item.rainRating, [
    "minimal rain protection",
    "light rain protection",
    "moderate rain protection",
    "strong rain protection",
    "waterproof-level rain protection",
  ]);
  const wind = ratingLabel(item.wind_rating || item.windRating, [
    "minimal wind protection",
    "light wind protection",
    "moderate wind protection",
    "strong wind protection",
    "high-wind protection",
  ]);
  const formality = ratingLabel(
    item.formality_rating || item.formalityRating,
    ["very casual", "casual", "versatile", "dressy", "formal"]
  );

  const colorLine = secondaryColor
    ? `${primaryColor} with ${secondaryColor} details`
    : primaryColor;

  return [
    `${name}. ${colorLine} ${subtype}.`,
    `${fit} fit${materials.length ? ` made from ${materials.join(", ")}` : ""}.`,
    `${warmth}; ${rain}; ${wind}; ${formality}.`,
    styleTags.length ? `Style: ${styleTags.join(", ")}.` : "",
    weatherUse.length ? `Best uses: ${weatherUse.join(", ")}.` : "",
    description ? `Confirmed description: ${description}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export default buildCanonicalJacketDescriptor;
