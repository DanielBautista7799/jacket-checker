import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { useCallback, useState } from "react";

const POSITION_OPTIONS = {
enableHighAccuracy: false,
timeout: 10000,
maximumAge: 300000,
};

function buildLocation(position, source) {
const latitude = Number(position?.coords?.latitude);
const longitude = Number(position?.coords?.longitude);

if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
throw new Error("Location information is unavailable.");
}

return {
id: "current-location",
name: "Current Location",
region: "",
country: "",
lat: latitude,
lon: longitude,
source,
};
}

function getBrowserPosition() {
return new Promise((resolve, reject) => {
if (!navigator.geolocation) {
    reject(new Error("Geolocation is not supported by this browser."));
    return;
}

navigator.geolocation.getCurrentPosition(
    resolve,
    reject,
    POSITION_OPTIONS,
);
});
}

async function getNativePosition() {
let permissions = await Geolocation.checkPermissions();
let locationPermission = permissions.location;

if (
locationPermission === "prompt" ||
locationPermission === "prompt-with-rationale"
) {
permissions = await Geolocation.requestPermissions({
    permissions: ["location"],
});

locationPermission = permissions.location;
}

if (locationPermission !== "granted") {
const error = new Error("Location permission was denied.");
error.code = "LOCATION_PERMISSION_DENIED";
throw error;
}

return Geolocation.getCurrentPosition(POSITION_OPTIONS);
}

function getLocationErrorMessage(error) {
const code = error?.code;
const message = String(error?.message || "").toLowerCase();

if (
code === 1 ||
code === "LOCATION_PERMISSION_DENIED" ||
code === "OS-PLUG-GLOC-0003" ||
(message.includes("permission") && message.includes("denied"))
) {
return "Location permission was denied.";
}

if (
code === 2 ||
message.includes("unavailable") ||
message.includes("disabled")
) {
return "Location information is unavailable.";
}

if (
code === 3 ||
message.includes("timeout") ||
message.includes("timed out")
) {
return "Location request timed out.";
}

if (message.includes("not supported")) {
return "Geolocation is not supported by this device.";
}

return "Could not get your current location.";
}

function useBrowserLocation() {
const [geoLoading, setGeoLoading] = useState(false);
const [geoError, setGeoError] = useState("");

const getCurrentLocation = useCallback(async () => {
setGeoLoading(true);
setGeoError("");

try {
    const nativePlatform = Capacitor.isNativePlatform();

    const position = nativePlatform
    ? await getNativePosition()
    : await getBrowserPosition();

    return buildLocation(
    position,
    nativePlatform ? "native" : "browser",
    );
} catch (error) {
    setGeoError(getLocationErrorMessage(error));
    return null;
} finally {
    setGeoLoading(false);
}
}, []);

return {
geoLoading,
geoError,
getCurrentLocation,
};
}

export default useBrowserLocation;