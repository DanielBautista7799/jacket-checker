import { useState } from "react";

function useBrowserLocation() {
const [geoLoading, setGeoLoading] = useState(false);
const [geoError, setGeoError] = useState("");

const getCurrentLocation = () => {
setGeoLoading(true);
setGeoError("");

return new Promise((resolve) => {
    if (!navigator.geolocation) {
    const message = "Geolocation is not supported by this browser.";
    setGeoError(message);
    setGeoLoading(false);
    resolve(null);
    return;
    }

    navigator.geolocation.getCurrentPosition(
    (position) => {
        const location = {
        id: "current-location",
        name: "Current Location",
        region: "",
        country: "",
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        source: "browser",
        };

        setGeoLoading(false);
        resolve(location);
    },
    (error) => {
        let message = "Could not get your current location.";

        if (error.code === error.PERMISSION_DENIED) {
        message = "Location permission was denied.";
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Location information is unavailable.";
        }

        if (error.code === error.TIMEOUT) {
        message = "Location request timed out.";
        }

        setGeoError(message);
        setGeoLoading(false);
        resolve(null);
    },
    {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
    }
    );
});
};

return {
geoLoading,
geoError,
getCurrentLocation,
};
}

export default useBrowserLocation;