import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Clock3,
  MapPin,
  Shield,
  Shirt,
  Sparkles,
  Thermometer,
  Wind,
  XCircle,
} from "lucide-react";

import RecommendationFeedback from "./RecommendationFeedback";
import TrendFeedback from "./TrendFeedback";
import WardrobeImage from "./WardrobeImage";
import ForecastStrip from "./ForecastStrip";
import WeatherMetric from "./WeatherMetric";
import RecommendationSkeleton from "./ui/RecommendationSkeleton";
import Badge from "./ui/Badge";

function formatLabel(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getSelectedConditions(weather, recommendation) {
  const selected = recommendation?.forecastAnalysis?.selectedConditions || {};
  return {
    feelsLike: toFiniteNumber(selected.feelsLike, toFiniteNumber(weather?.feelsLike, 0)),
    averageFeelsLike: toFiniteNumber(selected.averageFeelsLike, toFiniteNumber(selected.feelsLike, toFiniteNumber(weather?.feelsLike, 0))),
    lowestFeelsLike: toFiniteNumber(selected.lowestFeelsLike, toFiniteNumber(selected.feelsLike, toFiniteNumber(weather?.feelsLike, 0))),
    highestFeelsLike: toFiniteNumber(selected.highestFeelsLike, toFiniteNumber(selected.feelsLike, toFiniteNumber(weather?.feelsLike, 0))),
    windSpeed: toFiniteNumber(selected.windSpeed, toFiniteNumber(weather?.windSpeed, 0)),
    rainChance: toFiniteNumber(selected.rainChance, toFiniteNumber(weather?.rainChance, 0)),
  };
}

function getWindowSummary(recommendation) {
  const analysis = recommendation?.forecastAnalysis || {};
  const windowLabel = analysis.windowLabel || "Selected window";
  const timeRange = analysis.windowTimeRange || "";
  const isCurrent = analysis.windowId === "now";

  return {
    windowLabel,
    timeRange,
    isCurrent,
    eyebrow: `${recommendation?.decision === "YES" ? "YES" : "NO"} for ${windowLabel.toLowerCase()}`,
  };
}

function getFeelsLikeMetric(selectedConditions, isCurrent) {
  if (isCurrent) {
    return {
      label: "Feels like",
      value: `${Math.round(selectedConditions.feelsLike)}°F`,
    };
  }

  const low = Math.round(selectedConditions.lowestFeelsLike);
  const high = Math.round(selectedConditions.highestFeelsLike);

  return {
    label: "Window feel",
    value: low === high ? `${low}°F` : `${low}–${high}°F`,
  };
}

function getItemColor(item) {
  return item?.primary_color || item?.color || "other";
}

function getItemSubtype(item) {
  return item?.subtype || item?.type || "other";
}

function isActiveJacketMatch(match) {
  return Boolean(match?.item && match.item.category === "jacket" && match.item.archived !== true);
}

export default function CheckResultCard({
  weather,
  recommendation,
  mode = "guest",
  loading = false,
  feedbackValue = null,
  onFeedback,
  feedbackLoading = false,
  rankedMatches = [],
  selectedRankIndex = 0,
  onSelectRank,
}) {
  const isPersonalized = mode === "personalized";

  if (loading) return <RecommendationSkeleton />;

  if (!weather && !recommendation) {
    return (
      <section className="storm-card-soft flex min-h-[29rem] flex-col items-center justify-center rounded-[var(--radius-hero)] border-dashed p-8 text-center" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/14 bg-cyan-400/[0.06] text-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.08)]">
          <Shield size={30} aria-hidden="true" />
        </span>
        <h2 className="font-display mt-5 text-xl font-bold text-white">Your recommendation will appear here</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Choose a location and forecast window to see one clear jacket decision.</p>
      </section>
    );
  }

  if (weather && !recommendation) return <RecommendationSkeleton />;

  const isYes = recommendation.decision === "YES";
  const protectionBasis = recommendation.recommendationBasis || null;
  const isProtectionRecommendation = Boolean(protectionBasis);
  const shouldShowWardrobe = isPersonalized && isYes;
  const forecastAlerts = recommendation.forecastAnalysis?.alerts || [];
  const bringAlongSuggestions = recommendation.forecastAnalysis?.bringAlongSuggestions || [];
  const optionalLayer = recommendation.optionalLayer || null;
  const styleSuggestion = recommendation.styleSuggestion || null;
  const wardrobeMatch = isActiveJacketMatch(recommendation.closetMatch) ? recommendation.closetMatch : null;

  const visibleBringAlongSuggestions = bringAlongSuggestions.filter((suggestion) => {
    if (!isProtectionRecommendation) return true;
    const item = String(suggestion?.item || "").toLowerCase();
    return !["rain shell", "rain layer", "windbreaker", "light layer"].some((term) => item.includes(term));
  });

  const visibleRankedMatches = rankedMatches
    .map((match, originalIndex) => ({ match, originalIndex }))
    .filter(({ match }) => isActiveJacketMatch(match))
    .slice(0, 3);
  const topReasons = recommendation.reasons?.slice(0, 4) || [];
  const selectedConditions = getSelectedConditions(weather, recommendation);
  const windowSummary = getWindowSummary(recommendation);
  const feelsLikeMetric = getFeelsLikeMetric(selectedConditions, windowSummary.isCurrent);

  return (
    <article className="recommendation-shell p-5 sm:p-7 lg:p-8" aria-labelledby="recommendation-decision">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">{isPersonalized ? "Personalized recommendation" : "Jacket recommendation"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="info" className="normal-case tracking-normal">
                <Clock3 size={13} aria-hidden="true" />
                {windowSummary.windowLabel}{windowSummary.timeRange ? ` · ${windowSummary.timeRange}` : ""}
              </Badge>
            </div>
            <h2 id="recommendation-decision" className={`font-display mt-3 text-6xl font-bold tracking-[-0.075em] sm:text-7xl lg:text-8xl ${isYes ? "text-emerald-300" : "text-cyan-200"}`}>
              {recommendation.decision}
            </h2>
          </div>
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border ${isYes ? "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-200" : "border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-200"}`}>
            {isYes ? <CheckCircle2 size={29} aria-hidden="true" /> : <XCircle size={29} aria-hidden="true" />}
          </span>
        </div>

        <div className="mt-6 border-t border-slate-400/12 pt-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{windowSummary.eyebrow}</p>
          <p className="font-display mt-2 text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl">{recommendation.primaryItem}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{recommendation.summary}</p>
        </div>

        {weather && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <WeatherMetric icon={Thermometer} label={feelsLikeMetric.label} value={feelsLikeMetric.value} />
            <WeatherMetric icon={Wind} label="Wind" value={`${Math.round(selectedConditions.windSpeed)} mph`} accent="text-violet-200" />
            <WeatherMetric icon={CloudRain} label="Rain" value={`${Math.round(selectedConditions.rainChance)}%`} accent="text-cyan-200" />
            <WeatherMetric icon={MapPin} label="Location" value={weather.city} accent="text-blue-200" />
          </dl>
        )}

        {!isYes && optionalLayer && (
          <section className="mt-5 rounded-[var(--radius-card)] border border-amber-300/18 bg-amber-400/[0.065] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-100"><Shirt size={18} aria-hidden="true" /><h3 className="font-extrabold">Optional backup layer</h3></div>
            <p className="mt-3 font-bold text-white">{optionalLayer.item}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{optionalLayer.reason}</p>
          </section>
        )}

        {shouldShowWardrobe && visibleRankedMatches.length > 0 && (
          <section className="mt-5 rounded-[var(--radius-card)] border border-violet-300/18 bg-violet-400/[0.055] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-extrabold text-violet-100">{protectionBasis === "rain_protection" ? "Top rain-protection matches" : protectionBasis === "wind_protection" ? "Top wind-protection matches" : protectionBasis === "rain_wind_protection" ? "Top weather-protection matches" : "Best jackets you own"}</h3>
              <Badge tone="purple">Top {visibleRankedMatches.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {visibleRankedMatches.map(({ match, originalIndex }, displayIndex) => {
                const active = originalIndex === selectedRankIndex || match.item.id === wardrobeMatch?.item?.id;
                return (
                  <button key={match.item.id} type="button" onClick={() => onSelectRank?.(originalIndex)} aria-pressed={active} aria-label={`Select ${match.item.name} as jacket option ${displayIndex + 1}`} className={`overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20 ${active ? "border-violet-300/45 bg-violet-400/12" : "border-slate-400/12 bg-white/[0.035] hover:border-slate-300/24"}`}>
                    <WardrobeImage item={match.item} alt={`${match.item.name} primary wardrobe photo`} className="h-28 w-full object-cover" fallbackClassName="flex h-28 w-full items-center justify-center bg-white/[0.04] text-slate-600" iconSize={24} />
                    <span className="block p-3">
                      <span className="block text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-violet-200">{displayIndex === 0 ? "Best match" : `Option ${displayIndex + 1}`}</span>
                      <span className="mt-1 block truncate font-extrabold text-white">{match.item.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{formatLabel(getItemColor(match.item))} {formatLabel(getItemSubtype(match.item))}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {shouldShowWardrobe && wardrobeMatch && (
          <section className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-cyan-300/18 bg-cyan-400/[0.045] sm:grid sm:grid-cols-[minmax(13rem,0.75fr)_1fr]">
            <WardrobeImage item={wardrobeMatch.item} alt={`${wardrobeMatch.item.name} primary wardrobe photo`} className="h-64 w-full object-cover sm:h-full" fallbackClassName="flex h-64 w-full items-center justify-center bg-white/[0.04] text-slate-600 sm:h-full" iconSize={34} showLabel loading="eager" />
            <div className="p-5">
              <Badge tone="info"><Shirt size={13} aria-hidden="true" />Best match for {windowSummary.windowLabel.toLowerCase()}</Badge>
              <h3 className="font-display mt-3 text-2xl font-bold text-white">{wardrobeMatch.item.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{formatLabel(getItemColor(wardrobeMatch.item))} {formatLabel(getItemSubtype(wardrobeMatch.item))}</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {wardrobeMatch.reasons.slice(0, 4).map((reason, index) => <li key={`${reason}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />{reason}</li>)}
              </ul>
            </div>
          </section>
        )}

        {isPersonalized && styleSuggestion && (
          <section className="mt-5 rounded-[var(--radius-card)] border border-violet-300/18 bg-violet-400/[0.05] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-violet-100"><Sparkles size={18} aria-hidden="true" /><h3 className="font-extrabold">Style it</h3></div>
            <p className="font-display mt-3 text-xl font-bold text-white">{styleSuggestion.title || "Simple fit idea"}</p>
            {styleSuggestion.summary && <p className="mt-2 text-sm leading-6 text-slate-300">{styleSuggestion.summary}</p>}
            {styleSuggestion.weatherNote && <p className="mt-2 text-xs leading-5 text-violet-100/75">{styleSuggestion.weatherNote}</p>}
            {styleSuggestion.trendNote && <p className="mt-3 rounded-xl border border-violet-300/14 bg-violet-400/[0.06] px-3 py-3 text-xs leading-5 text-violet-100">{styleSuggestion.trendNote}</p>}
            <TrendFeedback styleSuggestion={styleSuggestion} recommendationId={recommendation.historyId || null} />
          </section>
        )}

        {isYes && visibleBringAlongSuggestions.length > 0 && (
          <section className="mt-5 rounded-[var(--radius-card)] border border-amber-300/18 bg-amber-400/[0.055] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-100"><AlertTriangle size={18} aria-hidden="true" /><h3 className="font-extrabold">Bring along</h3></div>
            <div className="mt-3 space-y-3">{visibleBringAlongSuggestions.slice(0, 2).map((suggestion, index) => <div key={`${suggestion.item}-${index}`}><p className="font-bold text-white">{suggestion.item}</p><p className="mt-1 text-sm leading-6 text-slate-300">{suggestion.reason}</p></div>)}</div>
          </section>
        )}

        {forecastAlerts.length > 0 && (
          <section className="mt-5 rounded-[var(--radius-card)] border border-cyan-300/18 bg-cyan-400/[0.05] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-cyan-100"><CloudRain size={18} aria-hidden="true" /><h3 className="font-extrabold">Forecast watch</h3></div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{forecastAlerts.slice(0, 2).map((alert, index) => <li key={`${alert.type}-${index}`}>• {alert.message}</li>)}</ul>
          </section>
        )}

        {topReasons.length > 0 && (
          <details className="mt-5 rounded-[var(--radius-card)] border border-slate-400/12 bg-white/[0.025] p-4 open:bg-white/[0.04]">
            <summary className="cursor-pointer list-none font-extrabold text-white">Why this recommendation?</summary>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{topReasons.map((reason, index) => <li key={`${reason}-${index}`}>• {reason}</li>)}</ul>
          </details>
        )}

        {shouldShowWardrobe && wardrobeMatch && onFeedback && <div className="mt-5"><RecommendationFeedback value={feedbackValue} onChange={onFeedback} loading={feedbackLoading} disabled={false} /></div>}
        <ForecastStrip weather={weather} recommendation={recommendation} />
      </div>
    </article>
  );
}
