import { useEffect, useState } from "react";
import LocationSearch from "./LocationSearch";

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
    className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5"
>
    <h3 className="mb-4 text-xl font-bold text-white">Profile</h3>

    <div className="grid gap-4 md:grid-cols-2">
    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Display Name
        </label>
        <input
        value={form.display_name}
        onChange={(e) => updateField("display_name", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Age
        </label>
        <input
        type="number"
        value={form.age}
        onChange={(e) => updateField("age", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Sex
        </label>
        <select
        value={form.sex}
        onChange={(e) => updateField("sex", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        >
        <option value="prefer_not_to_say">Prefer not to say</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="nonbinary">Nonbinary</option>
        <option value="other">Other</option>
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Cold Tolerance
        </label>
        <select
        value={form.cold_tolerance}
        onChange={(e) => updateField("cold_tolerance", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        >
        <option value="cold">I run cold</option>
        <option value="normal">Average</option>
        <option value="hot">I run hot</option>
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Height (inches)
        </label>
        <input
        type="number"
        value={form.height_inches}
        onChange={(e) => updateField("height_inches", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Weight (lbs)
        </label>
        <input
        type="number"
        value={form.weight_lbs}
        onChange={(e) => updateField("weight_lbs", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Rain Sensitivity
        </label>
        <select
        value={form.rain_sensitivity}
        onChange={(e) => updateField("rain_sensitivity", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        >
        <option value="low">Rain does not bother me much</option>
        <option value="normal">Average</option>
        <option value="high">Rain bothers me a lot</option>
        </select>
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Wind Sensitivity
        </label>
        <select
        value={form.wind_sensitivity}
        onChange={(e) => updateField("wind_sensitivity", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        >
        <option value="low">Wind does not bother me much</option>
        <option value="normal">Average</option>
        <option value="high">Wind bothers me a lot</option>
        </select>
    </div>

    <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Usual Time Outside
        </label>
        <select
        value={form.default_exposure}
        onChange={(e) => updateField("default_exposure", e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500"
        >
        <option value="short">Short — quick walks only</option>
        <option value="medium">Medium — walking around campus / errands</option>
        <option value="long">Long — outside for a while</option>
        </select>
    </div>

    <div className="md:col-span-2">
        <LocationSearch
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        />
    </div>
    </div>

    <button
    type="submit"
    disabled={profileLoading}
    className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
    >
    {profileLoading ? "Saving..." : "Save Profile"}
    </button>
</form>
);
}

export default ProfileForm;