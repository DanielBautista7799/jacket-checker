import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { generateStyleSuggestion } from "../utils/generateStyleSuggestion.js";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60";

export default function TrendPreviewPanel({ rules, profile }) {
  const [style, setStyle] = useState(profile?.style_preference || "streetwear");
  const [influence, setInfluence] = useState("subtle");
  const [weatherState, setWeatherState] = useState("mild");
  const [jacketColor, setJacketColor] = useState("navy");

  const preview = useMemo(() => {
    const rainy = weatherState === "rain" || weatherState === "rain_wind";
    const windy = weatherState === "wind" || weatherState === "rain_wind";
    const feelsLike = weatherState === "cold" ? 38 : weatherState === "hot" ? 84 : 63;

    return generateStyleSuggestion({
      recommendation: {
        decision: "YES",
        recommendationBasis: rainy ? "rain_protection" : windy ? "wind_protection" : "temperature",
      },
      weather: {
        city: "Preview",
        localTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        feelsLike,
        rainChance: rainy ? 75 : 10,
        windSpeed: windy ? 24 : 8,
        condition: rainy ? "Rain" : "Clear",
      },
      profile: {
        ...profile,
        style_preference: style,
        use_style_trends: influence !== "off",
        trend_influence: influence,
      },
      closetItem: {
        id: "preview-jacket",
        category: "jacket",
        name: "Preview jacket",
        subtype: rainy ? "rain jacket" : "bomber",
        primary_color: jacketColor,
        fit: "relaxed",
        materials: rainy ? ["nylon"] : ["cotton"],
      },
      forecastAnalysis: {
        windowId: "rest_of_day",
        selectedConditions: {
          feelsLike,
          lowestFeelsLike: feelsLike - 2,
          rainChance: rainy ? 75 : 10,
          windSpeed: windy ? 24 : 8,
          condition: rainy ? "Rain" : "Clear",
        },
      },
      activeTrendRules: rules,
      trendSource: "developer_preview",
    });
  }, [rules, profile, style, influence, weatherState, jacketColor]);

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
      <div className="flex items-center gap-2 text-violet-100">
        <Sparkles size={19} />
        <h2 className="font-black">Trend preview</h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={style} onChange={(event) => setStyle(event.target.value)} className={inputClass}>
          {[
            "streetwear",
            "minimal",
            "athletic",
            "smart_casual",
            "techwear",
            "vintage",
            "skater",
            "outdoor",
          ].map((value) => (
            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select value={influence} onChange={(event) => setInfluence(event.target.value)} className={inputClass}>
          <option value="off">Off</option>
          <option value="subtle">Subtle</option>
          <option value="balanced">Balanced</option>
        </select>
        <select value={weatherState} onChange={(event) => setWeatherState(event.target.value)} className={inputClass}>
          <option value="mild">Mild</option>
          <option value="cold">Cold</option>
          <option value="hot">Hot</option>
          <option value="rain">Rain</option>
          <option value="wind">Wind</option>
          <option value="rain_wind">Rain + wind</option>
        </select>
        <select value={jacketColor} onChange={(event) => setJacketColor(event.target.value)} className={inputClass}>
          <option value="black">Black</option>
          <option value="navy">Navy</option>
          <option value="blue">Blue</option>
          <option value="brown">Brown</option>
          <option value="olive">Olive</option>
          <option value="red">Red</option>
          <option value="white">White</option>
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="font-black text-white">{preview?.title || "Preview unavailable"}</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{preview?.summary}</p>
        {preview?.trendNote && (
          <p className="mt-3 text-sm leading-6 text-violet-100">{preview.trendNote}</p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Rule: {preview?.trend?.primaryRule?.name || "No matching trend rule"}
        </p>
      </div>
    </section>
  );
}
