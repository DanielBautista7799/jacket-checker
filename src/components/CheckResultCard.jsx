import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  MapPin,
  Shield,
  Shirt,
  Sparkles,
  Thermometer,
  Wind,
  XCircle,
} from "lucide-react";

import RecommendationFeedback from "./RecommendationFeedback";
import WardrobeImage from "./WardrobeImage";

function formatLabel(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getSelectedConditions(weather, recommendation) {
  const selected =
    recommendation?.forecastAnalysis?.selectedConditions || {};

  return {
    feelsLike: toFiniteNumber(
      selected.feelsLike,
      toFiniteNumber(weather?.feelsLike, 0)
    ),

    windSpeed: toFiniteNumber(
      selected.windSpeed,
      toFiniteNumber(weather?.windSpeed, 0)
    ),

    rainChance: toFiniteNumber(
      selected.rainChance,
      toFiniteNumber(weather?.rainChance, 0)
    ),
  };
}

function getItemColor(item) {
  return item?.primary_color || item?.color || "other";
}

function getItemSubtype(item) {
  return item?.subtype || item?.type || "other";
}

function isActiveJacketMatch(match) {
  return Boolean(
    match?.item &&
      match.item.category === "jacket" &&
      match.item.archived !== true
  );
}

function CheckResultCard({
  weather,
  recommendation,
  mode = "guest",
  feedbackValue = null,
  onFeedback,
  feedbackLoading = false,
  rankedMatches = [],
  selectedRankIndex = 0,
  onSelectRank,
}) {
  const isPersonalized = mode === "personalized";

  if (!weather && !recommendation) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
        <Shield className="mx-auto text-slate-600" size={42} />

        <p className="mt-4 font-semibold text-slate-300">
          Your jacket check will appear here.
        </p>
      </div>
    );
  }

  if (weather && !recommendation) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm text-slate-400">
          Checking forecast...
        </p>
      </div>
    );
  }

  const isYes = recommendation.decision === "YES";
  const protectionBasis = recommendation.recommendationBasis || null;
  const isProtectionRecommendation = Boolean(protectionBasis);
  const shouldShowWardrobe = isPersonalized && isYes;

  const forecastAlerts =
    recommendation.forecastAnalysis?.alerts || [];

  const bringAlongSuggestions =
    recommendation.forecastAnalysis?.bringAlongSuggestions || [];

  const optionalLayer = recommendation.optionalLayer || null;
  const styleSuggestion = recommendation.styleSuggestion || null;
  const wardrobeMatch = isActiveJacketMatch(
    recommendation.closetMatch
  )
    ? recommendation.closetMatch
    : null;

  const visibleBringAlongSuggestions = bringAlongSuggestions.filter(
    (suggestion) => {
      if (!isProtectionRecommendation) {
        return true;
      }

      const item = String(suggestion?.item || "").toLowerCase();

      return ![
        "rain shell",
        "rain layer",
        "windbreaker",
        "light layer",
      ].some((term) => item.includes(term));
    }
  );

  const visibleRankedMatches = rankedMatches
    .map((match, originalIndex) => ({
      match,
      originalIndex,
    }))
    .filter(({ match }) => isActiveJacketMatch(match))
    .slice(0, 3);

  const topReasons = recommendation.reasons?.slice(0, 3) || [];

  const selectedConditions = getSelectedConditions(
    weather,
    recommendation
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {isPersonalized ? "Personalized Check" : "Jacket Check"}
          </p>

          <h3
            className={`mt-1 text-6xl font-black tracking-tight ${
              isYes ? "text-sky-300" : "text-emerald-300"
            }`}
          >
            {recommendation.decision}
          </h3>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            isYes
              ? "bg-sky-500/10 text-sky-300"
              : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {isYes ? (
            <CheckCircle2 size={32} />
          ) : (
            <XCircle size={32} />
          )}
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-slate-400">
          {isYes
            ? isProtectionRecommendation
              ? "Wear or bring"
              : "Wear"
            : "Decision"}
        </p>

        <p className="mt-1 text-2xl font-black text-white">
          {recommendation.primaryItem}
        </p>

        <p className="mt-3 leading-6 text-slate-300">
          {recommendation.summary}
        </p>
      </div>

      {!isYes && optionalLayer && (
        <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-200">
            <Shirt size={18} />

            <p className="font-bold">Optional Light Layer</p>
          </div>

          <p className="font-black text-white">
            {optionalLayer.item}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {optionalLayer.reason}
          </p>
        </div>
      )}

      {shouldShowWardrobe && visibleRankedMatches.length > 0 && (
        <div className="mb-5 rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
          <p className="mb-4 font-bold text-purple-200">
            {protectionBasis === "rain_protection"
              ? "Top rain-protection matches"
              : protectionBasis === "wind_protection"
                ? "Top wind-protection matches"
                : protectionBasis === "rain_wind_protection"
                  ? "Top weather-protection matches"
                  : "Top jacket matches"}
          </p>

          <div className="space-y-3">
            {visibleRankedMatches.map(
              ({ match, originalIndex }, displayIndex) => {
                const active =
                  originalIndex === selectedRankIndex ||
                  match.item.id === wardrobeMatch?.item?.id;

                return (
                <button
                  key={match.item.id}
                  type="button"
                  onClick={() => onSelectRank?.(originalIndex)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-purple-400/60 bg-purple-500/20"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <WardrobeImage
                      item={match.item}
                      alt={`${match.item.name} primary wardrobe photo`}
                      className="h-16 w-16 object-cover"
                      fallbackClassName="flex h-16 w-16 items-center justify-center bg-white/10 text-slate-500"
                      iconSize={22}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-purple-300">
                      {displayIndex === 0
                        ? "Best match"
                        : `Option ${displayIndex + 1}`}
                    </p>

                    <p className="truncate font-black text-white">
                      {match.item.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {formatLabel(getItemColor(match.item))}{" "}
                      {formatLabel(getItemSubtype(match.item))}
                    </p>
                  </div>

                  {active && (
                    <CheckCircle2
                      className="shrink-0 text-purple-200"
                      size={22}
                    />
                  )}
                </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {shouldShowWardrobe && wardrobeMatch && (
        <div className="mb-5 overflow-hidden rounded-3xl border border-sky-400/20 bg-sky-400/10">
          <div className="h-56 w-full overflow-hidden bg-slate-900/60">
            <WardrobeImage
              item={wardrobeMatch.item}
              alt={`${wardrobeMatch.item.name} primary wardrobe photo`}
              className="h-56 w-full object-cover"
              fallbackClassName="flex h-56 w-full items-center justify-center bg-white/[0.04] text-slate-500"
              iconSize={34}
              showLabel
              loading="eager"
            />
          </div>

          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sky-200">
              <Shirt size={18} />

              <p className="font-bold">Selected Wardrobe Match</p>
            </div>

            <p className="text-xl font-black text-white">
              {wardrobeMatch.item.name}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {formatLabel(getItemColor(wardrobeMatch.item))}{" "}
              {formatLabel(getItemSubtype(wardrobeMatch.item))}
            </p>

            <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
              {wardrobeMatch.reasons
                .slice(0, 4)
                .map((reason, index) => (
                  <li key={`${reason}-${index}`}>• {reason}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {isPersonalized && styleSuggestion && (
        <div className="mb-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-200">
            <Sparkles size={18} />
            <p className="font-bold">Style idea</p>
          </div>

          <p className="font-black text-white">
            {styleSuggestion.title || "Simple fit idea"}
          </p>

          {styleSuggestion.summary && (
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {styleSuggestion.summary}
            </p>
          )}

          {styleSuggestion.weatherNote && (
            <p className="mt-2 text-xs leading-5 text-emerald-100/80">
              {styleSuggestion.weatherNote}
            </p>
          )}
        </div>
      )}

      {isYes && visibleBringAlongSuggestions.length > 0 && (
        <div className="mb-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-200">
            <AlertTriangle size={18} />

            <p className="font-bold">Bring Along</p>
          </div>

          <div className="space-y-3">
            {visibleBringAlongSuggestions
              .slice(0, 2)
              .map((suggestion, index) => (
                <div key={`${suggestion.item}-${index}`}>
                  <p className="font-bold text-white">
                    {suggestion.item}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    {suggestion.reason}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {forecastAlerts.length > 0 && (
        <div className="mb-5 rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
          <div className="mb-3 flex items-center gap-2 text-sky-200">
            <CloudRain size={18} />

            <p className="font-bold">Forecast Watch</p>
          </div>

          <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {forecastAlerts.slice(0, 2).map((alert, index) => (
              <li key={`${alert.type}-${index}`}>
                • {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {topReasons.length > 0 && (
        <div className="mb-5 rounded-3xl bg-white/[0.03] p-5">
          <p className="mb-3 font-bold text-white">Why?</p>

          <ul className="space-y-2 text-sm leading-5 text-slate-300">
            {topReasons.map((reason, index) => (
              <li key={`${reason}-${index}`}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {shouldShowWardrobe && wardrobeMatch && onFeedback && (
        <div className="mb-5">
          <RecommendationFeedback
            value={feedbackValue}
            onChange={onFeedback}
            loading={feedbackLoading}
            disabled={false}
          />
        </div>
      )}

      {weather && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Thermometer size={16} />
              Window feels
            </div>

            <p className="text-xl font-black text-white">
              {Math.round(selectedConditions.feelsLike)}°F
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Wind size={16} />
              Peak wind
            </div>

            <p className="text-xl font-black text-white">
              {Math.round(selectedConditions.windSpeed)} mph
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <CloudRain size={16} />
              Rain risk
            </div>

            <p className="text-xl font-black text-white">
              {Math.round(selectedConditions.rainChance)}%
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <MapPin size={16} />
              Location
            </div>

            <p className="truncate text-sm font-bold text-white">
              {weather.city}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckResultCard;
