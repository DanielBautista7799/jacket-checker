import { TREND_CONFIG } from "../config/trendConfig.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase().replaceAll("_", " ");
}

function toArray(value) {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map(normalize).filter(Boolean);
}

function includesLoose(values, candidate) {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return false;

  return values.some(
    (value) =>
      value === normalizedCandidate ||
      value.includes(normalizedCandidate) ||
      normalizedCandidate.includes(value)
  );
}

function getColorFamily(color) {
  const value = normalize(color);

  if (["black", "charcoal", "dark grey", "dark gray"].some((entry) => value.includes(entry))) return "dark neutral";
  if (["white", "cream", "beige", "stone", "light grey", "light gray"].some((entry) => value.includes(entry))) return "light neutral";
  if (["navy", "blue", "denim"].some((entry) => value.includes(entry))) return "blue";
  if (["brown", "tan", "olive", "khaki", "camel", "rust"].some((entry) => value.includes(entry))) return "earth";
  if (["red", "orange", "yellow", "pink"].some((entry) => value.includes(entry))) return "warm";
  if (["purple", "teal", "green"].some((entry) => value.includes(entry))) return "cool";
  if (["bold", "multicolor", "multi color"].some((entry) => value.includes(entry))) return "bold";
  return value || "other";
}

function getPreferenceAdjustment(rule, trendPreferenceModel) {
  if (!trendPreferenceModel) return 0;

  const ruleScore = Number(
    trendPreferenceModel.byRule?.[rule.id] ??
      trendPreferenceModel.bySlug?.[rule.slug] ??
      0
  );
  const style = toArray(rule.style_tags)[0];
  const styleScore = Number(trendPreferenceModel.byStyle?.[style] || 0);

  return Math.max(-2, Math.min(2, ruleScore + styleScore * 0.35));
}

function scoreRule({
  rule,
  style,
  season,
  climateTags,
  jacket,
  trendPreferenceModel,
}) {
  const reasons = [];
  let score = Number(rule.weight || 0.5);

  const styles = toArray(rule.style_tags);
  if (styles.length === 0 || includesLoose(styles, style)) {
    score += 2;
    reasons.push("selected style");
  }

  const seasons = toArray(rule.seasons || rule.season);
  if (seasons.length === 0 || includesLoose(seasons, season)) {
    score += 1.2;
    reasons.push("current season");
  } else if (includesLoose(seasons, "transitional")) {
    score += 0.5;
    reasons.push("transitional season");
  }

  const ruleClimate = toArray(rule.climate_tags);
  const climateMatches = ruleClimate.filter((tag) => includesLoose(climateTags, tag));
  if (climateMatches.length > 0) {
    score += Math.min(1.6, climateMatches.length * 0.8);
    reasons.push(`forecast: ${climateMatches.join(", ")}`);
  }

  const subtypes = toArray(rule.jacket_subtypes);
  if (subtypes.length > 0 && includesLoose(subtypes, jacket?.subtype || jacket?.type)) {
    score += 1.1;
    reasons.push("jacket type");
  }

  const colorFamily = getColorFamily(jacket?.primary_color || jacket?.color);
  const colors = toArray(rule.color_families);
  if (colors.length > 0 && includesLoose(colors, colorFamily)) {
    score += 0.8;
    reasons.push("jacket color family");
  }

  const fits = toArray(rule.fit_tags);
  if (fits.length > 0 && includesLoose(fits, jacket?.fit)) {
    score += 0.6;
    reasons.push("jacket fit");
  }

  const ruleMaterials = toArray(rule.material_tags);
  const jacketMaterials = toArray(jacket?.materials);
  if (ruleMaterials.some((material) => includesLoose(jacketMaterials, material))) {
    score += 0.8;
    reasons.push("jacket material");
  }

  const preferenceAdjustment = getPreferenceAdjustment(rule, trendPreferenceModel);
  score += preferenceAdjustment;

  if (Math.abs(preferenceAdjustment) >= 0.25) {
    reasons.push(preferenceAdjustment > 0 ? "positive trend feedback" : "negative trend feedback");
  }

  return {
    rule,
    score,
    reasons,
    preferenceAdjustment,
  };
}

export function matchStyleTrendRules({
  activeResult,
  style,
  jacket = null,
  trendPreferenceModel = null,
}) {
  if (!activeResult?.enabled || activeResult.influence === "off") {
    return {
      primary: null,
      supporting: null,
      matches: [],
    };
  }

  const matches = activeResult.activeRules
    .map((rule) =>
      scoreRule({
        rule,
        style,
        season: activeResult.season,
        climateTags: activeResult.climateTags,
        jacket,
        trendPreferenceModel,
      })
    )
    .filter((entry) => entry.score >= TREND_CONFIG.minimumPrimaryScore)
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score;
      return String(first.rule.slug).localeCompare(String(second.rule.slug));
    });

  const primary = matches[0] || null;
  const supporting =
    activeResult.influence === "balanced" &&
    matches[1]?.score >= TREND_CONFIG.minimumSupportingScore
      ? matches[1]
      : null;

  return {
    primary,
    supporting,
    matches,
  };
}
