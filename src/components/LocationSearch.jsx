import { useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import useLocationSearch from "../hooks/useLocationSearch";
import useBrowserLocation from "../hooks/useBrowserLocation";

function LocationSearch({ selectedLocation, onSelectLocation }) {
const [query, setQuery] = useState("");

const {
locations,
locationLoading,
locationError,
searchLocations,
setLocations,
} = useLocationSearch();

const { geoLoading, geoError, getCurrentLocation } = useBrowserLocation();

const handleChange = (e) => {
const value = e.target.value;
setQuery(value);
onSelectLocation(null);
searchLocations(value);
};

const handleSelect = (location) => {
onSelectLocation(location);
setQuery(`${location.name}, ${location.region}, ${location.country}`);
setLocations([]);
};

const handleUseCurrentLocation = async () => {
const browserLocation = await getCurrentLocation();

if (!browserLocation) return;

onSelectLocation(browserLocation);
setQuery("Current Location");
setLocations([]);
};

const selectedLocationLabel =
selectedLocation?.source === "browser"
    ? "Current Location"
    : selectedLocation
    ? `${selectedLocation.name}, ${selectedLocation.region}, ${selectedLocation.country}`
    : "";

return (
<div className="space-y-4">
    <button
    type="button"
    onClick={handleUseCurrentLocation}
    disabled={geoLoading}
    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-4 font-bold text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
    >
    <LocateFixed size={19} className="transition group-hover:scale-110" />
    {geoLoading ? "Getting Your Location..." : "Use My Location"}
    </button>

    {geoError && (
    <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
        {geoError}
    </p>
    )}

    <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-white/10" />
    <span className="text-xs uppercase tracking-wide text-slate-500">
        or search manually
    </span>
    <div className="h-px flex-1 bg-white/10" />
    </div>

    <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-200">
        Location
    </label>

    <div className="relative">
        <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
        type="text"
        placeholder="Search a city, town, or country"
        value={query}
        onChange={handleChange}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 pl-11 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10"
        />
    </div>

    {locationLoading && (
        <p className="text-sm text-slate-400">Searching locations...</p>
    )}

    {locationError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
        {locationError}
        </p>
    )}

    {locations.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-xl">
        {locations.map((location) => (
            <button
            key={`${location.id}-${location.lat}-${location.lon}`}
            type="button"
            onClick={() => handleSelect(location)}
            className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.06]"
            >
            <MapPin size={17} className="mt-0.5 text-sky-300" />

            <span>
                <span className="block text-sm font-semibold text-white">
                {location.name}
                </span>
                <span className="block text-xs text-slate-400">
                {[location.region, location.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
            </span>
            </button>
        ))}
        </div>
    )}
    </div>

    {selectedLocation && (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
        <MapPin size={17} />
        <span>Selected: {selectedLocationLabel}</span>
    </div>
    )}
</div>
);
}

export default LocationSearch;