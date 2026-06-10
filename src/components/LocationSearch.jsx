import { useState } from "react";
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
    <div>
    <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={geoLoading}
        className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
    >
        {geoLoading ? "Getting Your Location..." : "📍 Use My Location"}
    </button>

    {geoError && <p className="mt-2 text-sm text-red-300">{geoError}</p>}
    </div>

    <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-slate-700" />
    <span className="text-xs uppercase tracking-wide text-slate-500">
        or
    </span>
    <div className="h-px flex-1 bg-slate-700" />
    </div>

    <div className="space-y-3">
    <label className="block text-sm font-medium text-slate-200">
        Search Location
    </label>

    <input
        type="text"
        placeholder="Enter a city"
        value={query}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
    />

    {locationLoading && (
        <p className="text-sm text-slate-400">Searching locations...</p>
    )}

    {locationError && (
        <p className="text-sm text-red-300">{locationError}</p>
    )}

    {locations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        {locations.map((location) => (
            <button
            key={`${location.id}-${location.lat}-${location.lon}`}
            type="button"
            onClick={() => handleSelect(location)}
            className="block w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800"
            >
            {location.name}, {location.region}, {location.country}
            </button>
        ))}
        </div>
    )}
    </div>

    {selectedLocation && (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
        Selected: {selectedLocationLabel}
    </div>
    )}
</div>
);
}

export default LocationSearch;