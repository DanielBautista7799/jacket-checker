import { useId, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import useLocationSearch from "../hooks/useLocationSearch";
import useBrowserLocation from "../hooks/useBrowserLocation";
import useAnalytics from "../hooks/useAnalytics";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Spinner from "./ui/Spinner";

export default function LocationSearch({ selectedLocation, onSelectLocation, analyticsMode = "guest" }) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const { track } = useAnalytics();
  const { locations, locationLoading, locationError, searchLocations, setLocations } = useLocationSearch();
  const { geoLoading, geoError, getCurrentLocation } = useBrowserLocation();

  const handleChange = (event) => { const value = event.target.value; setQuery(value); onSelectLocation(null); searchLocations(value); };
  const handleSelect = (location) => {
    onSelectLocation(location);
    setQuery([location.name, location.region, location.country].filter(Boolean).join(", "));
    setLocations([]);
    track(analyticsMode === "guest" ? "guest_location_search" : "personalized_location_search", { experienceMode: analyticsMode, metadata: { location_source: "search", result_selected: true } });
  };
  const handleUseCurrentLocation = async () => {
    const browserLocation = await getCurrentLocation();
    if (!browserLocation) return;
    onSelectLocation(browserLocation); setQuery("Current Location"); setLocations([]);
    track(analyticsMode === "guest" ? "guest_browser_location" : "personalized_browser_location", { experienceMode: analyticsMode, metadata: { location_source: "browser" } });
  };
  const selectedLocationLabel = selectedLocation?.source === "browser" ? "Current Location" : selectedLocation ? [selectedLocation.name, selectedLocation.region, selectedLocation.country].filter(Boolean).join(", ") : "";

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${listId}-input`} className="mb-2 block text-sm font-extrabold text-slate-200">Location</label>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input id={`${listId}-input`} type="search" placeholder="Search a city, town, or country" value={query} onChange={handleChange} className="pl-11 pr-11" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={locations.length > 0} aria-controls={listId} aria-describedby={`${listId}-status`} />
          {locationLoading && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-200"><Spinner size={17} label="Searching locations" /></span>}
        </div>
        <div id={`${listId}-status`} className="mt-2 min-h-5 text-xs font-bold text-slate-500" aria-live="polite">{locationLoading ? "Searching locations…" : locations.length ? `${locations.length} location options available.` : ""}</div>
        {locationError && <div className="mt-2"><Alert tone="error">{locationError}</Alert></div>}
        {locations.length > 0 && (
          <div id={listId} role="listbox" aria-label="Location suggestions" className="glass-nav scrollbar-subtle mt-2 max-h-72 overflow-y-auto rounded-2xl p-1.5 shadow-xl">
            {locations.map((location) => (
              <button key={`${location.id}-${location.lat}-${location.lon}`} type="button" role="option" aria-selected="false" onClick={() => handleSelect(location)} className="flex min-h-14 w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06] focus-visible:bg-white/[0.08]">
                <MapPin size={17} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" />
                <span><span className="block text-sm font-extrabold text-white">{location.name}</span><span className="block text-xs text-slate-400">{[location.region, location.country].filter(Boolean).join(", ")}</span></span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button type="button" variant="secondary" onClick={handleUseCurrentLocation} disabled={geoLoading} loading={geoLoading} loadingLabel="Getting your location" className="w-full">
        <LocateFixed size={18} aria-hidden="true" />{geoLoading ? "Getting your location…" : "Use my location"}
      </Button>
      {geoError && <Alert tone="error">{geoError}</Alert>}
      {selectedLocation && <Alert tone="success" title="Selected location"><span className="inline-flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{selectedLocationLabel}</span></Alert>}
    </div>
  );
}
