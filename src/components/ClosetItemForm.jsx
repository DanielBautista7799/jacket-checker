import { useEffect, useRef, useState } from "react";
import {
AlertCircle,
Check,
ImagePlus,
LoaderCircle,
Pencil,
Plus,
RotateCcw,
Shirt,
Sparkles,
X,
} from "lucide-react";
import useClosetImageAnalysis from "../hooks/useClosetImageAnalysis";
import {
getConfidenceLabel,
} from "../utils/normalizeClosetAnalysis";
import { validateClosetImage } from "../utils/uploadClosetImage";

const inputClass =
"w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10";

const initialForm = {
name: "",
type: "windbreaker",
color: "black",
secondary_color: "",
warmth_rating: 2,
rain_rating: 3,
wind_rating: 4,
formality_rating: 1,
style_tags: ["streetwear"],
description: "",
weather_use: [],
};

const STYLE_TAGS = [
"streetwear",
"minimal",
"athletic",
"smart_casual",
"techwear",
"vintage",
"skater",
"outdoor",
];

const WEATHER_USES = [
"mild_weather",
"cool_weather",
"cold_weather",
"very_cold_weather",
"light_rain",
"heavy_rain",
"wind",
"dry_weather",
];

const COLORS = [
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
];

function formatLabel(value) {
return value
.replaceAll("_", " ")
.replace(/\b\w/g, (character) => character.toUpperCase());
}

function RatingField({ label, value, onChange }) {
return (
<div>
    <label className="mb-2 block text-sm font-semibold text-slate-200">
    {label}: {value}/5
    </label>

    <input
    type="range"
    min="1"
    max="5"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full"
    />
</div>
);
}

function ConfidencePill({ label, value }) {
const low = value < 0.55;

return (
<span
    className={`rounded-full px-3 py-1 text-xs font-bold ${
    low
        ? "bg-amber-400/15 text-amber-200"
        : "bg-white/10 text-slate-300"
    }`}
>
    {label}: {getConfidenceLabel(value)}
</span>
);
}

function ClosetItemForm({ onSave, loading }) {
const [form, setForm] = useState(initialForm);
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState("");
const [imageError, setImageError] = useState("");
const [entryMode, setEntryMode] = useState("select");

const fileInputRef = useRef(null);

const {
analysis,
analysisStatus,
analysisError,
analyzeImage,
resetAnalysis,
} = useClosetImageAnalysis();

const isAnalyzing = analysisStatus === "analyzing";
const isReviewing = entryMode === "review";
const isManual = entryMode === "manual";

useEffect(() => {
return () => {
    if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
    }
};
}, [imagePreview]);

const updateField = (field, value) => {
setForm((current) => ({
    ...current,
    [field]: value,
}));
};

const toggleArrayValue = (field, value) => {
setForm((current) => {
    const currentValues = current[field];
    const active = currentValues.includes(value);

    return {
    ...current,
    [field]: active
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
    };
});
};

const clearImage = () => {
if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
}

setImageFile(null);
setImagePreview("");
setImageError("");

if (fileInputRef.current) {
    fileInputRef.current.value = "";
}
};

const startOver = () => {
clearImage();
resetAnalysis();
setForm(initialForm);
setEntryMode("select");
};

const handleImageChange = (event) => {
const file = event.target.files?.[0] || null;

if (!file) return;

const validation = validateClosetImage(file);

if (!validation.valid) {
    setImageError(validation.error);
    return;
}

if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
}

resetAnalysis();
setImageFile(file);
setImagePreview(URL.createObjectURL(file));
setImageError("");
setEntryMode("selected");
};

const handleAnalyze = async () => {
const result = await analyzeImage(imageFile);

if (!result) return;

setForm({
    name: result.name,
    type: result.type,
    color: result.primaryColor,
    secondary_color: result.secondaryColor || "",
    warmth_rating: result.warmthRating,
    rain_rating: result.rainRating,
    wind_rating: result.windRating,
    formality_rating: result.formalityRating,
    style_tags:
    result.styleTags.length > 0
        ? result.styleTags
        : ["streetwear"],
    description: result.description,
    weather_use: result.weatherUse,
});

setEntryMode("review");
};

const enterManualMode = () => {
resetAnalysis();
setForm(initialForm);
setEntryMode("manual");
};

const handleSubmit = async (event) => {
event.preventDefault();

if (!form.name.trim()) return;

const aiWasUsed = Boolean(analysis && isReviewing);

const payload = {
    name: form.name.trim(),
    category: "jacket",
    type: form.type,
    color: form.color,
    secondary_color: form.secondary_color || null,
    warmth_rating: Number(form.warmth_rating),
    rain_rating: Number(form.rain_rating),
    wind_rating: Number(form.wind_rating),
    formality_rating: Number(form.formality_rating),
    style_tags: form.style_tags,
    description: form.description.trim() || null,
    weather_use: form.weather_use,

    ai_generated: aiWasUsed,
    ai_confidence: aiWasUsed
    ? analysis.confidence
    : null,
    ai_original_result: aiWasUsed
    ? analysis
    : null,
};

const savedItem = await onSave(payload, imageFile);

if (savedItem) {
    startOver();
}
};

return (
<form
    onSubmit={handleSubmit}
    className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl"
>
    <div className="mb-6 flex items-center gap-3">
    <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300">
        <Shirt size={22} />
    </div>

    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Add Jacket
        </p>
        <h2 className="text-2xl font-black text-white">
        Build your closet
        </h2>
    </div>
    </div>

    <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={handleImageChange}
    className="hidden"
    />

    {!imagePreview && !isManual && (
    <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center transition hover:border-sky-500/50 hover:bg-sky-500/5"
    >
        <ImagePlus size={32} className="text-sky-300" />

        <span className="mt-3 font-bold text-white">
        Add a jacket photo
        </span>

        <span className="mt-1 text-sm text-slate-400">
        JPG, PNG, or WebP up to 5 MB
        </span>
    </button>
    )}

    {imagePreview && (
    <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        <img
        src={imagePreview}
        alt="Selected jacket preview"
        className="h-72 w-full object-cover"
        />

        {!isAnalyzing && (
        <button
            type="button"
            onClick={startOver}
            className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-2 text-white backdrop-blur transition hover:bg-red-500"
            aria-label="Remove selected image"
        >
            <X size={18} />
        </button>
        )}
    </div>
    )}

    {imageError && (
    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={17} />
        {imageError}
    </div>
    )}

    {entryMode === "selected" && (
    <div className="grid gap-3 sm:grid-cols-2">
        <button
        type="button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-4 font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {isAnalyzing ? (
            <>
            <LoaderCircle className="animate-spin" size={19} />
            Analyzing...
            </>
        ) : (
            <>
            <Sparkles size={19} />
            Analyze Jacket
            </>
        )}
        </button>

        <button
        type="button"
        onClick={enterManualMode}
        disabled={isAnalyzing}
        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 font-bold text-slate-200 transition hover:bg-white/10"
        >
        <Pencil size={18} />
        Enter Manually
        </button>
    </div>
    )}

    {analysisError && (
    <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
        <p className="text-sm text-amber-100">
        {analysisError}
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
        <button
            type="button"
            onClick={handleAnalyze}
            className="font-bold text-purple-200 hover:text-purple-100"
        >
            Retry analysis
        </button>

        <button
            type="button"
            onClick={enterManualMode}
            className="font-bold text-sky-200 hover:text-sky-100"
        >
            Enter manually
        </button>
        </div>
    </div>
    )}

    {isReviewing && analysis && (
    <div className="mb-5 rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
        <div className="flex items-center gap-2 text-purple-200">
        <Sparkles size={18} />
        <p className="font-bold">AI suggestion</p>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
        Review every field before adding this jacket.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
        <ConfidencePill
            label="Type"
            value={analysis.confidence.type}
        />

        <ConfidencePill
            label="Color"
            value={analysis.confidence.color}
        />

        <ConfidencePill
            label="Protection"
            value={analysis.confidence.weatherRatings}
        />
        </div>
    </div>
    )}

    {(isReviewing || isManual) && (
    <>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-200">
            Item name
            </label>

            <input
            value={form.name}
            onChange={(event) =>
                updateField("name", event.target.value)
            }
            placeholder="Black windbreaker"
            className={inputClass}
            required
            />
        </div>

        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
            Jacket type
            </label>

            <select
            value={form.type}
            onChange={(event) =>
                updateField("type", event.target.value)
            }
            className={inputClass}
            >
            <option value="windbreaker">Windbreaker</option>
            <option value="rain_shell">Rain shell</option>
            <option value="hoodie">Hoodie</option>
            <option value="denim_jacket">Denim jacket</option>
            <option value="bomber">Bomber jacket</option>
            <option value="leather_jacket">Leather jacket</option>
            <option value="puffer">Puffer jacket</option>
            <option value="fleece">Fleece</option>
            <option value="overcoat">Overcoat</option>
            <option value="heavy_coat">Heavy coat</option>
            <option value="other">Other</option>
            </select>
        </div>

        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
            Primary color
            </label>

            <select
            value={form.color}
            onChange={(event) =>
                updateField("color", event.target.value)
            }
            className={inputClass}
            >
            {COLORS.map((color) => (
                <option key={color} value={color}>
                {formatLabel(color)}
                </option>
            ))}
            </select>
        </div>

        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
            Secondary color
            </label>

            <select
            value={form.secondary_color}
            onChange={(event) =>
                updateField(
                "secondary_color",
                event.target.value
                )
            }
            className={inputClass}
            >
            <option value="">None</option>

            {COLORS.map((color) => (
                <option key={color} value={color}>
                {formatLabel(color)}
                </option>
            ))}
            </select>
        </div>

        <div />

        <RatingField
            label="Warmth"
            value={form.warmth_rating}
            onChange={(value) =>
            updateField("warmth_rating", value)
            }
        />

        <RatingField
            label="Rain protection"
            value={form.rain_rating}
            onChange={(value) =>
            updateField("rain_rating", value)
            }
        />

        <RatingField
            label="Wind protection"
            value={form.wind_rating}
            onChange={(value) =>
            updateField("wind_rating", value)
            }
        />

        <RatingField
            label="Formality"
            value={form.formality_rating}
            onChange={(value) =>
            updateField("formality_rating", value)
            }
        />

        <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-200">
            Description
            </label>

            <textarea
            value={form.description}
            onChange={(event) =>
                updateField("description", event.target.value)
            }
            rows="3"
            maxLength="240"
            className={inputClass}
            placeholder="Lightweight black hooded windbreaker."
            />

            <p className="mt-1 text-right text-xs text-slate-500">
            {form.description.length}/240
            </p>
        </div>

        <div className="md:col-span-2">
            <p className="mb-3 text-sm font-semibold text-slate-200">
            Style tags
            </p>

            <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => {
                const active = form.style_tags.includes(tag);

                return (
                <button
                    key={tag}
                    type="button"
                    onClick={() =>
                    toggleArrayValue("style_tags", tag)
                    }
                    className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    active
                        ? "bg-sky-500 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                >
                    {formatLabel(tag)}
                </button>
                );
            })}
            </div>
        </div>

        <div className="md:col-span-2">
            <p className="mb-3 text-sm font-semibold text-slate-200">
            Best weather use
            </p>

            <div className="flex flex-wrap gap-2">
            {WEATHER_USES.map((weatherUse) => {
                const active =
                form.weather_use.includes(weatherUse);

                return (
                <button
                    key={weatherUse}
                    type="button"
                    onClick={() =>
                    toggleArrayValue(
                        "weather_use",
                        weatherUse
                    )
                    }
                    className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    active
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                >
                    {formatLabel(weatherUse)}
                </button>
                );
            })}
            </div>
        </div>
        </div>

        <button
        type="submit"
        disabled={loading || !form.name.trim()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
        {loading ? (
            <>
            <LoaderCircle className="animate-spin" size={19} />
            Uploading and saving...
            </>
        ) : (
            <>
            {isReviewing ? (
                <Check size={19} />
            ) : (
                <Plus size={19} />
            )}

            {isReviewing
                ? "Confirm and Add"
                : "Add to Closet"}
            </>
        )}
        </button>

        <button
        type="button"
        onClick={startOver}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
        <RotateCcw size={17} />
        Start Over
        </button>
    </>
    )}

    {entryMode === "select" && (
    <button
        type="button"
        onClick={enterManualMode}
        className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 font-bold text-slate-300 transition hover:bg-white/5"
    >
        Enter without a photo
    </button>
    )}
</form>
);
}

export default ClosetItemForm;