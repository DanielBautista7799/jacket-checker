import {
useCallback,
useEffect,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router";

import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { isNativeAuthCallbackUrl } from "../utils/authRedirects";

const handledAuthUrls = new Set();
const inFlightAuthUrls = new Map();
const MAX_REMEMBERED_URLS = 20;

function rememberHandledUrl(url) {
handledAuthUrls.add(url);

while (
    handledAuthUrls.size >
    MAX_REMEMBERED_URLS
) {
    const oldestUrl =
    handledAuthUrls.values().next().value;

    if (!oldestUrl) {
    break;
    }

    handledAuthUrls.delete(oldestUrl);
}
}

function getAuthCallbackTask(
url,
completeAuthCallback,
) {
const existingTask =
    inFlightAuthUrls.get(url);

if (existingTask) {
    return existingTask;
}

const task = completeAuthCallback(url);

inFlightAuthUrls.set(url, task);

void task.finally(() => {
    if (inFlightAuthUrls.get(url) === task) {
    inFlightAuthUrls.delete(url);
    }
});

return task;
}

export default function NativeAuthHandler() {
const navigate = useNavigate();

const {
    completeAuthCallback,
    refreshSession,
} = useAuth();

const handleUrl = useCallback(
    async (url) => {
    if (
        !url ||
        !isNativeAuthCallbackUrl(url) ||
        handledAuthUrls.has(url)
    ) {
        return;
    }

    const result =
        await getAuthCallbackTask(
        url,
        completeAuthCallback,
        );

    if (!result?.handled) {
        return;
    }

    rememberHandledUrl(url);

    navigate(
        result.destination || "/auth",
        {
        replace: true,
        },
    );
    },
    [completeAuthCallback, navigate],
);

useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
    return undefined;
    }

    let disposed = false;
    const listenerHandles = [];

    const retainListener = async (
    listenerPromise,
    ) => {
    const handle = await listenerPromise;

    if (disposed) {
        await handle.remove();
        return;
    }

    listenerHandles.push(handle);
    };

    const updateRefreshState = async (
    isActive,
    ) => {
    if (isActive) {
        supabase.auth.startAutoRefresh();
        await refreshSession();
        return;
    }

    supabase.auth.stopAutoRefresh();
    };

    const initialize = async () => {
    await retainListener(
        CapacitorApp.addListener(
        "appUrlOpen",
        ({ url }) => {
            void handleUrl(url);
        },
        ),
    );

    await retainListener(
        CapacitorApp.addListener(
        "appStateChange",
        ({ isActive }) => {
            void updateRefreshState(
            isActive,
            );
        },
        ),
    );

    const launch =
        await CapacitorApp.getLaunchUrl();

    if (launch?.url) {
        await handleUrl(launch.url);
    }

    const state =
        await CapacitorApp.getState();

    await updateRefreshState(
        state.isActive,
    );
    };

    void initialize();

    return () => {
    disposed = true;

    for (const handle of listenerHandles) {
        void handle.remove();
    }

    supabase.auth.stopAutoRefresh();
    };
}, [handleUrl, refreshSession]);

return null;
}