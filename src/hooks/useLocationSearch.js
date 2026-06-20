import {
useRef,
useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

async function readErrorPayload(
response
) {
if (
    !(
    response instanceof
    Response
    )
) {
    return null;
}

try {
    return await response
    .clone()
    .json();
} catch {
    try {
    const text =
        await response
        .clone()
        .text();

    return text
        ? {
            error: text,
        }
        : null;
    } catch {
    return null;
    }
}
}

async function getFunctionErrorMessage(
error
) {
const payload =
    await readErrorPayload(
    error?.context
    );

if (
    typeof payload?.error ===
    "string" &&
    payload.error.trim()
) {
    return payload.error;
}

if (
    typeof error?.message ===
    "string" &&
    error.message.trim()
) {
    return error.message;
}

return "Could not search locations.";
}

function useLocationSearch() {
const [
    locations,
    setLocations,
] = useState([]);

const [
    locationLoading,
    setLocationLoading,
] = useState(false);

const [
    locationError,
    setLocationError,
] = useState("");

const requestIdRef =
    useRef(0);

const searchLocations =
    async (query) => {
    const normalizedQuery =
        query?.trim() || "";

    const requestId =
        requestIdRef.current +
        1;

    requestIdRef.current =
        requestId;

    if (
        normalizedQuery.length <
        2
    ) {
        setLocations([]);
        setLocationError("");
        setLocationLoading(
        false
        );

        return;
    }

    setLocationLoading(
        true
    );

    setLocationError("");

    try {
        const {
        data,
        error,
        } =
        await supabase.functions.invoke(
            "get-weather",
            {
            body: {
                action:
                "search",
                query:
                normalizedQuery,
            },
            }
        );

        if (
        requestId !==
        requestIdRef.current
        ) {
        return;
        }

        if (error) {
        throw new Error(
            await getFunctionErrorMessage(
            error
            )
        );
        }

        if (
        !data?.success ||
        !Array.isArray(
            data.locations
        )
        ) {
        throw new Error(
            data?.error ||
            "Could not search locations."
        );
        }

        setLocations(
        data.locations
        );
    } catch (error) {
        if (
        requestId !==
        requestIdRef.current
        ) {
        return;
        }

        setLocationError(
        error.message ||
            "Could not search locations."
        );

        setLocations([]);
    } finally {
        if (
        requestId ===
        requestIdRef.current
        ) {
        setLocationLoading(
            false
        );
        }
    }
    };

return {
    locations,
    locationLoading,
    locationError,
    searchLocations,
    setLocations,
};
}

export default useLocationSearch;