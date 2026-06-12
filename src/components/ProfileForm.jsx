import { useEffect, useState } from "react";
import {
CloudRain,
Clock,
Palette,
Ruler,
Save,
Scale,
Shirt,
Sparkles,
Thermometer,
UserRound,
Waves,
} from "lucide-react";
import LocationSearch from "./LocationSearch";

function FieldShell({ icon: Icon, label, children }) {
return (
<div>
    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
    {Icon && <Icon size={16} className="text-sky-300" />}
    {label}
    </label>
    {children}
</div>
);
}

const inputClass =
"w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10";

function ProfileForm({ profile, onSave, profileLoading }) {
const [form, setForm] = useState({
display_name: "",
age: "",
sex: "prefer_not_to_say",
height_inches: "",
weight_lbs: "",
cold_tolerance: "normal",
rain_sensitivity: "normal",
wind_sensitivity: "normal",
default_exposure: "medium",

style_preference: "streetwear",
fit_preference: "relaxed",
preferred_color: "black",
favorite_shoes: "jordans",
default_bottoms: "cargos",
style_influence: "american_streetwear",
});

const [selectedLocation, setSelectedLocation] = useState(null);

useEffect(() => {
if (!profile) return;

setForm({
    display_name: profile.display_name || "",
    age: profile.age || "",
    sex: profile.sex || "prefer_not_to_say",
    height_inches: profile.height_inches || "",
    weight_lbs: profile.weight_lbs || "",
    cold_tolerance: profile.cold_tolerance || "normal",
    rain_sensitivity: profile.rain_sensitivity || "normal",
    wind_sensitivity: profile.wind_sensitivity || "normal",
    default_exposure: profile.default_exposure || "medium",

    style_preference: profile.style_preference || "streetwear",
    fit_preference: profile.fit_preference || "relaxed",
    preferred_color: profile.preferred_color || "black",
    favorite_shoes: profile.favorite_shoes || "jordans",
    default_bottoms: profile.default_bottoms || "cargos",
    style_influence: profile.style_influence || "american_streetwear",
});

if (profile.default_location_lat && profile.default_location_lon) {
    setSelectedLocation({
    name: profile.default_location_name,
    region: profile.default_location_region,
    country: profile.default_location_country,
    lat: profile.default_location_lat,
    lon: profile.default_location_lon,
    });
}
}, [profile]);

const updateField = (field, value) => {
setForm((current) => ({
    ...current,
    [field]: value,
}));
};

const handleSubmit = async (e) => {
e.preventDefault();

const payload = {
    ...form,
    age: form.age ? Number(form.age) : null,
    height_inches: form.height_inches ? Number(form.height_inches) : null,
    weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : null,

    default_location_name: selectedLocation?.name || null,
    default_location_region: selectedLocation?.region || null,
    default_location_country: selectedLocation?.country || null,
    default_location_lat: selectedLocation?.lat || null,
    default_location_lon: selectedLocation?.lon || null,
};

await onSave(payload);
};

return (
<form
    onSubmit={handleSubmit}
    className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl"
>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Saved Profile
    </p>
    <h3 className="mt-1 text-2xl font-black text-white">
        Comfort & style settings
    </h3>
    </div>

    <div className="grid gap-5 md:grid-cols-2">
    <FieldShell icon={UserRound} label="Display Name">
        <input
        value={form.display_name}
        onChange={(e) => updateField("display_name", e.target.value)}
        className={inputClass}
        />
    </FieldShell>

    <FieldShell icon={UserRound} label="Age">
        <input
        type="number"
        value={form.age}
        onChange={(e) => updateField("age", e.target.value)}
        className={inputClass}
        />
    </FieldShell>

    <FieldShell icon={UserRound} label="Sex">
        <select
        value={form.sex}
        onChange={(e) => updateField("sex", e.target.value)}
        className={inputClass}
        >
        <option value="prefer_not_to_say">Prefer not to say</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="nonbinary">Nonbinary</option>
        <option value="other">Other</option>
        </select>
    </FieldShell>

    <FieldShell icon={Thermometer} label="Cold Tolerance">
        <select
        value={form.cold_tolerance}
        onChange={(e) => updateField("cold_tolerance", e.target.value)}
        className={inputClass}
        >
        <option value="cold">I run cold</option>
        <option value="normal">Average</option>
        <option value="hot">I run hot</option>
        </select>
    </FieldShell>

    <FieldShell icon={Ruler} label="Height (inches)">
        <input
        type="number"
        value={form.height_inches}
        onChange={(e) => updateField("height_inches", e.target.value)}
        className={inputClass}
        />
    </FieldShell>

    <FieldShell icon={Scale} label="Weight (lbs)">
        <input
        type="number"
        value={form.weight_lbs}
        onChange={(e) => updateField("weight_lbs", e.target.value)}
        className={inputClass}
        />
    </FieldShell>

    <FieldShell icon={CloudRain} label="Rain Sensitivity">
        <select
        value={form.rain_sensitivity}
        onChange={(e) => updateField("rain_sensitivity", e.target.value)}
        className={inputClass}
        >
        <option value="low">Rain does not bother me much</option>
        <option value="normal">Average</option>
        <option value="high">Rain bothers me a lot</option>
        </select>
    </FieldShell>

    <FieldShell icon={Waves} label="Wind Sensitivity">
        <select
        value={form.wind_sensitivity}
        onChange={(e) => updateField("wind_sensitivity", e.target.value)}
        className={inputClass}
        >
        <option value="low">Wind does not bother me much</option>
        <option value="normal">Average</option>
        <option value="high">Wind bothers me a lot</option>
        </select>
    </FieldShell>

    <div className="md:col-span-2">
        <FieldShell icon={Clock} label="Usual Time Outside">
        <select
            value={form.default_exposure}
            onChange={(e) => updateField("default_exposure", e.target.value)}
            className={inputClass}
        >
            <option value="short">Short — quick walks only</option>
            <option value="medium">
            Medium — walking around campus / errands
            </option>
            <option value="long">Long — outside for a while</option>
        </select>
        </FieldShell>
    </div>

    <div className="md:col-span-2">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
        <div className="mb-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
            <Shirt size={16} />
            Style Mode
            </p>
            <p className="mt-1 text-sm text-slate-300">
            Used only in personalized mode to suggest how to style the jacket.
            </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
            <FieldShell icon={Sparkles} label="Style Preference">
            <select
                value={form.style_preference}
                onChange={(e) =>
                updateField("style_preference", e.target.value)
                }
                className={inputClass}
            >
                <option value="streetwear">Streetwear</option>
                <option value="minimal">Minimal</option>
                <option value="athletic">Athletic</option>
                <option value="smart_casual">Smart casual</option>
                <option value="techwear">Techwear</option>
                <option value="vintage">Vintage</option>
                <option value="skater">Skater</option>
                <option value="outdoor">Outdoor</option>
            </select>
            </FieldShell>

            <FieldShell icon={Shirt} label="Fit Preference">
            <select
                value={form.fit_preference}
                onChange={(e) =>
                updateField("fit_preference", e.target.value)
                }
                className={inputClass}
            >
                <option value="relaxed">Relaxed</option>
                <option value="fitted">Fitted</option>
                <option value="oversized">Oversized</option>
                <option value="layered">Layered</option>
            </select>
            </FieldShell>

            <FieldShell icon={Palette} label="Preferred Color">
            <select
                value={form.preferred_color}
                onChange={(e) =>
                updateField("preferred_color", e.target.value)
                }
                className={inputClass}
            >
                <option value="black">Black</option>
                <option value="white">White</option>
                <option value="grey">Grey</option>
                <option value="navy">Navy</option>
                <option value="earth_tones">Earth tones</option>
                <option value="bold">Bold colors</option>
            </select>
            </FieldShell>

            <FieldShell icon={Shirt} label="Favorite Shoes">
            <select
                value={form.favorite_shoes}
                onChange={(e) =>
                updateField("favorite_shoes", e.target.value)
                }
                className={inputClass}
            >
                <option value="jordans">Jordans</option>
                <option value="sneakers">Sneakers</option>
                <option value="boots">Boots</option>
                <option value="loafers">Loafers</option>
                <option value="running_shoes">Running shoes</option>
            </select>
            </FieldShell>

            <FieldShell icon={Shirt} label="Default Bottoms">
            <select
                value={form.default_bottoms}
                onChange={(e) =>
                updateField("default_bottoms", e.target.value)
                }
                className={inputClass}
            >
                <option value="cargos">Cargos</option>
                <option value="jeans">Jeans</option>
                <option value="chinos">Chinos</option>
                <option value="joggers">Joggers</option>
                <option value="trousers">Trousers</option>
            </select>
            </FieldShell>

            <FieldShell icon={Sparkles} label="Style Influence">
            <select
                value={form.style_influence}
                onChange={(e) =>
                updateField("style_influence", e.target.value)
                }
                className={inputClass}
            >
                <option value="american_streetwear">
                American streetwear
                </option>
                <option value="korean_casual">Korean casual</option>
                <option value="japanese_minimal">Japanese minimal</option>
                <option value="european_clean">European clean</option>
                <option value="skater">Skater</option>
                <option value="outdoor">Outdoor</option>
                <option value="athletic">Athletic</option>
                <option value="techwear">Techwear</option>
            </select>
            </FieldShell>
        </div>
        </div>
    </div>

    <div className="md:col-span-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Default Location
        </p>

        <LocationSearch
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
        />
        </div>
    </div>
    </div>

    <button
    type="submit"
    disabled={profileLoading}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
    >
    <Save size={19} />
    {profileLoading ? "Saving..." : "Save Profile"}
    </button>
</form>
);
}

export default ProfileForm;