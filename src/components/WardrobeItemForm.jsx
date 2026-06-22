import { useEffect, useMemo, useRef, useState } from "react";
import {
AlertCircle,
CheckCircle2,
ImagePlus,
LoaderCircle,
RotateCcw,
Save,
Shirt,
Sparkles,
X,
} from "lucide-react";

import {
WARDROBE_CATEGORIES,
WARDROBE_COLORS,
WARDROBE_FITS,
WARDROBE_MATERIALS,
WARDROBE_STYLE_TAGS,
WARDROBE_WEATHER_USES,
formatWardrobeLabel,
getSubtypesForCategory,
} from "../data/wardrobeOptions";
import useWardrobeImageAnalysis from "../hooks/useWardrobeImageAnalysis";
import { getWardrobeConfidenceLabel } from "../utils/normalizeWardrobeAnalysis";
import { validateClosetImage } from "../utils/uploadClosetImage";

const inputClass =
"w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10";

function createInitialForm() {
return {
name: "",
category: "jacket",
subtype: "windbreaker",
primary_color: "black",
secondary_color: "",
materials: [],
warmth_rating: 2,
rain_rating: 2,
wind_rating: 2,
formality_rating: 1,
fit: "regular",
style_tags: [],
weather_use: [],
description: "",
};
}

function buildFormFromItem(item) {
if (!item) {
return createInitialForm();
}

return {
name: item.name || "",
category: item.category || "jacket",
subtype: item.subtype || item.type || "other",
primary_color: item.primary_color || item.color || "other",
secondary_color: item.secondary_color || "",
materials: Array.isArray(item.materials) ? item.materials : [],
warmth_rating: Number(item.warmth_rating) || 1,
rain_rating: Number(item.rain_rating) || 1,
wind_rating: Number(item.wind_rating) || 1,
formality_rating: Number(item.formality_rating) || 1,
fit: item.fit || "regular",
style_tags: Array.isArray(item.style_tags) ? item.style_tags : [],
weather_use: Array.isArray(item.weather_use) ? item.weather_use : [],
description: item.description || "",
};
}

function buildFormFromAnalysis(result) {
return {
name: result.name,
category: result.category,
subtype: result.subtype,
primary_color: result.primaryColor,
secondary_color: result.secondaryColor || "",
materials: result.materials,
warmth_rating: result.warmthRating,
rain_rating: result.rainRating,
wind_rating: result.windRating,
formality_rating: result.formalityRating,
fit: result.fit,
style_tags: result.styleTags,
weather_use: result.weatherUse,
description: result.description,
};
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
    onChange={(event) => onChange(Number(event.target.value))}
    className="w-full"
    />
</div>
);
}

function ToggleGroup({ label, options, selectedValues, onToggle }) {
return (
<div className="md:col-span-2">
    <p className="mb-3 text-sm font-semibold text-slate-200">{label}</p>

    <div className="flex flex-wrap gap-2">
    {options.map((option) => {
        const active = selectedValues.includes(option);

        return (
        <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition ${
            active
                ? "bg-sky-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
        >
            {formatWardrobeLabel(option)}
        </button>
        );
    })}
    </div>
</div>
);
}

function WardrobeItemFormInner({
onSave,
loading = false,
editingItem = null,
onCancelEdit,
}) {
const [form, setForm] = useState(() => buildFormFromItem(editingItem));
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(
() => editingItem?.image_url || ""
);
const [imageError, setImageError] = useState("");

const {
analysis,
analysisStatus,
analysisError,
analyzeImage,
resetAnalysis,
} = useWardrobeImageAnalysis();

const fileInputRef = useRef(null);
const isEditing = Boolean(editingItem);
const isAnalyzing = analysisStatus === "analyzing";
const hasAppliedAnalysis = analysisStatus === "success" && Boolean(analysis);

const subtypeOptions = useMemo(() => {
const options = getSubtypesForCategory(form.category);

if (form.subtype && !options.includes(form.subtype)) {
    return [form.subtype, ...options];
}

return options;
}, [form.category, form.subtype]);

const colorOptions = useMemo(() => {
const currentColors = [form.primary_color, form.secondary_color].filter(
    Boolean
);

const missingColors = currentColors.filter(
    (color) => !WARDROBE_COLORS.includes(color)
);

return [...new Set([...missingColors, ...WARDROBE_COLORS])];
}, [form.primary_color, form.secondary_color]);

useEffect(() => {
return () => {
    if (imagePreview.startsWith("blob:")) {
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
    const currentValues = Array.isArray(current[field])
    ? current[field]
    : [];

    return {
    ...current,
    [field]: currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
    };
});
};

const handleCategoryChange = (category) => {
setForm((current) => ({
    ...current,
    category,
    subtype: getSubtypesForCategory(category)[0],
}));
};

const handleImageChange = (event) => {
const file = event.target.files?.[0] || null;

if (!file) {
    return;
}

const validation = validateClosetImage(file);

if (!validation.valid) {
    setImageError(validation.error);
    event.target.value = "";
    return;
}

if (imagePreview.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview);
}

resetAnalysis();
setImageFile(file);
setImagePreview(URL.createObjectURL(file));
setImageError("");
};

const clearReplacementImage = () => {
if (imagePreview.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview);
}

resetAnalysis();
setImageFile(null);
setImagePreview(editingItem?.image_url || "");
setImageError("");

if (fileInputRef.current) {
    fileInputRef.current.value = "";
}
};

const resetForm = () => {
if (imagePreview.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview);
}

resetAnalysis();
setForm(createInitialForm());
setImageFile(null);
setImagePreview("");
setImageError("");

if (fileInputRef.current) {
    fileInputRef.current.value = "";
}
};

const handleAnalyze = async () => {
const result = await analyzeImage(imageFile, form.category);

if (!result) {
    return;
}

setForm(buildFormFromAnalysis(result));
};

const handleDiscardAnalysis = () => {
resetAnalysis();
};

const handleCancel = () => {
resetForm();
onCancelEdit?.();
};

const handleSubmit = async (event) => {
event.preventDefault();

if (!form.name.trim() || isAnalyzing) {
    return;
}

const payload = {
    name: form.name.trim(),
    category: form.category,
    subtype: form.subtype,
    primary_color: form.primary_color,
    secondary_color: form.secondary_color || null,
    materials: form.materials,
    warmth_rating: Number(form.warmth_rating),
    rain_rating: Number(form.rain_rating),
    wind_rating: Number(form.wind_rating),
    formality_rating: Number(form.formality_rating),
    fit: form.fit,
    style_tags: form.style_tags,
    weather_use: form.weather_use,
    description: form.description.trim() || null,
    confirmed_by_user: true,
};

if (hasAppliedAnalysis) {
    payload.ai_generated = true;
    payload.ai_provider = analysis.provider;
    payload.ai_model = analysis.model;
    payload.ai_confidence = analysis.confidence;
    payload.original_ai_json = analysis.originalAiJson;
} else if (!isEditing) {
    payload.ai_generated = false;
    payload.ai_provider = null;
    payload.ai_model = null;
    payload.ai_confidence = null;
    payload.original_ai_json = null;
}

const savedItem = await onSave(payload, imageFile);

if (savedItem) {
    resetForm();
}
};

return (
<form
    onSubmit={handleSubmit}
    className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl"
>
    <div className="mb-6 flex items-center gap-3">
    <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300">
        <Shirt size={22} />
    </div>

    <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {isEditing ? "Edit Item" : "Add Item"}
        </p>

        <h2 className="text-2xl font-black text-white">
        {isEditing ? editingItem.name : "Build your wardrobe"}
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

    {imagePreview ? (
    <div className="relative mb-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        <img
        src={imagePreview}
        alt="Wardrobe item preview"
        className="h-64 w-full object-cover"
        />

        {imageFile && (
        <button
            type="button"
            onClick={clearReplacementImage}
            className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-2 text-white transition hover:bg-red-500"
            aria-label="Remove selected replacement image"
        >
            <X size={18} />
        </button>
        )}
    </div>
    ) : (
    <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mb-4 flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center transition hover:border-sky-500/50 hover:bg-sky-500/5"
    >
        <ImagePlus size={30} className="text-sky-300" />

        <span className="mt-3 font-bold text-white">Add an item photo</span>

        <span className="mt-1 text-sm text-slate-400">
        JPG, PNG, or WebP up to 5 MB
        </span>
    </button>
    )}

    <div className="mb-5 grid gap-3 sm:grid-cols-2">
    {imagePreview && (
        <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isAnalyzing}
        className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
        {imageFile ? "Choose a different photo" : "Replace photo"}
        </button>
    )}

    {imageFile && (
        <button
        type="button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {isAnalyzing ? (
            <LoaderCircle size={18} className="animate-spin" />
        ) : (
            <Sparkles size={18} />
        )}

        {isAnalyzing
            ? "Analyzing item..."
            : hasAppliedAnalysis
            ? "Analyze photo again"
            : "Analyze photo with AI"}
        </button>
    )}
    </div>

    {!imageFile && !isEditing && (
    <p className="mb-5 text-sm text-slate-400">
        A photo is optional. You can enter every field manually.
    </p>
    )}

    {imageFile && !hasAppliedAnalysis && !isAnalyzing && (
    <p className="mb-5 text-sm text-slate-400">
        AI analysis is optional. You can keep the photo and complete the form
        manually.
    </p>
    )}

    {imageError && (
    <div className="mb-5 flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <span>{imageError}</span>
    </div>
    )}

    {analysisError && (
    <div className="mb-5 flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div>
        <p className="font-bold">Automatic analysis did not finish.</p>
        <p className="mt-1">{analysisError}</p>
        <p className="mt-1 text-amber-200/80">
            Your selected photo is still ready, and manual entry remains
            available below.
        </p>
        </div>
    </div>
    )}

    {hasAppliedAnalysis && (
    <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
        <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <div>
            <p className="font-bold">AI suggestions are ready for review.</p>
            <p className="mt-1 text-emerald-200/80">
                Every field below stays editable. Saving confirms your final
                corrections.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {getWardrobeConfidenceLabel(analysis.confidence.overall)}
            </p>
            </div>
        </div>

        <button
            type="button"
            onClick={handleDiscardAnalysis}
            className="shrink-0 rounded-xl border border-emerald-300/20 px-3 py-2 text-xs font-bold transition hover:bg-emerald-300/10"
        >
            Treat as manual
        </button>
        </div>
    </div>
    )}

    <div className="grid gap-5 md:grid-cols-2">
    <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Item name
        </label>

        <input
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        placeholder="Black windbreaker"
        className={inputClass}
        required
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Category
        </label>

        <select
        value={form.category}
        onChange={(event) => handleCategoryChange(event.target.value)}
        className={inputClass}
        >
        {WARDROBE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
            {category.label}
            </option>
        ))}
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Type
        </label>

        <select
        value={form.subtype}
        onChange={(event) => updateField("subtype", event.target.value)}
        className={inputClass}
        >
        {subtypeOptions.map((subtype) => (
            <option key={subtype} value={subtype}>
            {formatWardrobeLabel(subtype)}
            </option>
        ))}
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Primary color
        </label>

        <select
        value={form.primary_color}
        onChange={(event) =>
            updateField("primary_color", event.target.value)
        }
        className={inputClass}
        >
        {colorOptions.map((color) => (
            <option key={color} value={color}>
            {formatWardrobeLabel(color)}
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
            updateField("secondary_color", event.target.value)
        }
        className={inputClass}
        >
        <option value="">None</option>

        {colorOptions.map((color) => (
            <option key={color} value={color}>
            {formatWardrobeLabel(color)}
            </option>
        ))}
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Fit
        </label>

        <select
        value={form.fit}
        onChange={(event) => updateField("fit", event.target.value)}
        className={inputClass}
        >
        {WARDROBE_FITS.map((fit) => (
            <option key={fit.value} value={fit.value}>
            {fit.label}
            </option>
        ))}
        </select>
    </div>

    <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Description
        </label>

        <textarea
        value={form.description}
        onChange={(event) => updateField("description", event.target.value)}
        placeholder="Short notes about the item, details, or when you wear it"
        rows="3"
        maxLength="240"
        className={inputClass}
        />
    </div>

    <RatingField
        label="Warmth"
        value={form.warmth_rating}
        onChange={(value) => updateField("warmth_rating", value)}
    />

    <RatingField
        label="Rain protection"
        value={form.rain_rating}
        onChange={(value) => updateField("rain_rating", value)}
    />

    <RatingField
        label="Wind protection"
        value={form.wind_rating}
        onChange={(value) => updateField("wind_rating", value)}
    />

    <RatingField
        label="Formality"
        value={form.formality_rating}
        onChange={(value) => updateField("formality_rating", value)}
    />

    <ToggleGroup
        label="Materials"
        options={WARDROBE_MATERIALS}
        selectedValues={form.materials}
        onToggle={(value) => toggleArrayValue("materials", value)}
    />

    <ToggleGroup
        label="Style tags"
        options={WARDROBE_STYLE_TAGS}
        selectedValues={form.style_tags}
        onToggle={(value) => toggleArrayValue("style_tags", value)}
    />

    <ToggleGroup
        label="Best weather use"
        options={WARDROBE_WEATHER_USES}
        selectedValues={form.weather_use}
        onToggle={(value) => toggleArrayValue("weather_use", value)}
    />
    </div>

    <div className="mt-6 flex flex-wrap gap-3">
    <button
        type="submit"
        disabled={loading || isAnalyzing || !form.name.trim()}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
        {loading ? (
        <LoaderCircle size={18} className="animate-spin" />
        ) : (
        <Save size={18} />
        )}

        {loading
        ? "Saving..."
        : isEditing
            ? "Save changes"
            : "Save wardrobe item"}
    </button>

    {isEditing ? (
        <button
        type="button"
        onClick={handleCancel}
        disabled={loading || isAnalyzing}
        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
        <X size={18} />
        Cancel edit
        </button>
    ) : (
        <button
        type="button"
        onClick={resetForm}
        disabled={loading || isAnalyzing}
        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
        <RotateCcw size={18} />
        Reset
        </button>
    )}
    </div>
</form>
);
}

function WardrobeItemForm(props) {
const formKey = props.editingItem?.id || "new-wardrobe-item";

return <WardrobeItemFormInner key={formKey} {...props} />;
}

export default WardrobeItemForm;
