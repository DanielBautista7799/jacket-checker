import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Shirt, X } from "lucide-react";
import { validateClosetImage } from "../utils/uploadClosetImage";

const inputClass =
"w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10";

const initialForm = {
name: "",
type: "windbreaker",
color: "black",
warmth_rating: 2,
rain_rating: 3,
wind_rating: 4,
formality_rating: 1,
style_tags: ["streetwear"],
};

function ClosetItemForm({ onSave, loading }) {
const [form, setForm] = useState(initialForm);
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState("");
const [imageError, setImageError] = useState("");

const fileInputRef = useRef(null);

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

const toggleStyleTag = (tag) => {
setForm((current) => {
    const hasTag = current.style_tags.includes(tag);

    return {
    ...current,
    style_tags: hasTag
        ? current.style_tags.filter((currentTag) => currentTag !== tag)
        : [...current.style_tags, tag],
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

const handleImageChange = (event) => {
const file = event.target.files?.[0] || null;

if (!file) {
    clearImage();
    return;
}

const validation = validateClosetImage(file);

if (!validation.valid) {
    clearImage();
    setImageError(validation.error);
    return;
}

if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
}

setImageFile(file);
setImagePreview(URL.createObjectURL(file));
setImageError("");
};

const handleSubmit = async (event) => {
event.preventDefault();

if (!form.name.trim()) return;

const payload = {
    name: form.name.trim(),
    category: "jacket",
    type: form.type,
    color: form.color,
    warmth_rating: Number(form.warmth_rating),
    rain_rating: Number(form.rain_rating),
    wind_rating: Number(form.wind_rating),
    formality_rating: Number(form.formality_rating),
    style_tags: form.style_tags,
};

const savedItem = await onSave(payload, imageFile);

if (!savedItem) return;

setForm(initialForm);
clearImage();
};

const styleTags = [
"streetwear",
"minimal",
"athletic",
"smart_casual",
"techwear",
"vintage",
"skater",
"outdoor",
];

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
        <h2 className="text-2xl font-black text-white">Closet item</h2>
    </div>
    </div>

    <div className="mb-6">
    <p className="mb-2 text-sm font-semibold text-slate-200">
        Jacket image
    </p>

    <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        className="hidden"
    />

    {imagePreview ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        <img
            src={imagePreview}
            alt="Selected jacket preview"
            className="h-64 w-full object-cover"
        />

        <button
            type="button"
            onClick={clearImage}
            className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-2 text-white backdrop-blur transition hover:bg-red-500"
            aria-label="Remove selected image"
        >
            <X size={18} />
        </button>
        </div>
    ) : (
        <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center transition hover:border-sky-500/50 hover:bg-sky-500/5"
        >
        <ImagePlus size={30} className="text-sky-300" />
        <span className="mt-3 font-bold text-white">
            Add a jacket photo
        </span>
        <span className="mt-1 text-sm text-slate-400">
            JPG, PNG, or WebP up to 5 MB
        </span>
        </button>
    )}

    {imageError && (
        <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
        {imageError}
        </p>
    )}
    </div>

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
        Jacket type
        </label>

        <select
        value={form.type}
        onChange={(event) => updateField("type", event.target.value)}
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
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Color
        </label>

        <select
        value={form.color}
        onChange={(event) => updateField("color", event.target.value)}
        className={inputClass}
        >
        <option value="black">Black</option>
        <option value="white">White</option>
        <option value="grey">Grey</option>
        <option value="navy">Navy</option>
        <option value="olive">Olive</option>
        <option value="brown">Brown</option>
        <option value="cream">Cream</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Warmth: {form.warmth_rating}/5
        </label>

        <input
        type="range"
        min="1"
        max="5"
        value={form.warmth_rating}
        onChange={(event) =>
            updateField("warmth_rating", event.target.value)
        }
        className="w-full"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Rain protection: {form.rain_rating}/5
        </label>

        <input
        type="range"
        min="1"
        max="5"
        value={form.rain_rating}
        onChange={(event) =>
            updateField("rain_rating", event.target.value)
        }
        className="w-full"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Wind protection: {form.wind_rating}/5
        </label>

        <input
        type="range"
        min="1"
        max="5"
        value={form.wind_rating}
        onChange={(event) =>
            updateField("wind_rating", event.target.value)
        }
        className="w-full"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Formality: {form.formality_rating}/5
        </label>

        <input
        type="range"
        min="1"
        max="5"
        value={form.formality_rating}
        onChange={(event) =>
            updateField("formality_rating", event.target.value)
        }
        className="w-full"
        />
    </div>

    <div className="md:col-span-2">
        <p className="mb-3 text-sm font-semibold text-slate-200">
        Style tags
        </p>

        <div className="flex flex-wrap gap-2">
        {styleTags.map((tag) => {
            const active = form.style_tags.includes(tag);

            return (
            <button
                key={tag}
                type="button"
                onClick={() => toggleStyleTag(tag)}
                className={`rounded-full px-3 py-2 text-xs font-bold capitalize transition ${
                active
                    ? "bg-sky-500 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
            >
                {tag.replaceAll("_", " ")}
            </button>
            );
        })}
        </div>
    </div>
    </div>

    <button
    type="submit"
    disabled={loading || !form.name.trim()}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
    >
    <Plus size={19} />
    {loading
        ? imageFile
        ? "Uploading and saving..."
        : "Saving..."
        : "Add to Closet"}
    </button>
</form>
);
}

export default ClosetItemForm;