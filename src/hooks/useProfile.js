import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const profileMemoryCache = new Map();

function getProfileCacheKey(userId) {
return `jacket-check:profile:${userId}`;
}

function readCachedProfile(userId) {
if (!userId) {
return null;
}

if (profileMemoryCache.has(userId)) {
return profileMemoryCache.get(userId);
}

try {
const savedProfile = localStorage.getItem(
    getProfileCacheKey(userId)
);

if (!savedProfile) {
    return null;
}

const parsedProfile = JSON.parse(savedProfile);

profileMemoryCache.set(userId, parsedProfile);

return parsedProfile;
} catch (error) {
console.error(
    "Could not read profile cache:",
    error
);

return null;
}
}

function writeCachedProfile(userId, profile) {
if (!userId) {
return;
}

profileMemoryCache.set(userId, profile);

try {
localStorage.setItem(
    getProfileCacheKey(userId),
    JSON.stringify(profile)
);
} catch (error) {
console.error(
    "Could not write profile cache:",
    error
);
}
}

function clearCachedProfile(userId) {
if (!userId) {
return;
}

profileMemoryCache.delete(userId);

try {
localStorage.removeItem(
    getProfileCacheKey(userId)
);
} catch (error) {
console.error(
    "Could not clear profile cache:",
    error
);
}
}

function useProfile(user) {
const cachedProfile = readCachedProfile(user?.id);

const [profile, setProfile] = useState(
cachedProfile
);

const [profileLoading, setProfileLoading] =
useState(Boolean(user) && !cachedProfile);

const [
profileRefreshing,
setProfileRefreshing,
] = useState(false);

const [profileError, setProfileError] =
useState("");

const fetchProfile = useCallback(
async ({ silent = false } = {}) => {
    if (!user) {
    setProfile(null);
    setProfileLoading(false);
    setProfileRefreshing(false);

    return null;
    }

    const existingProfile =
    readCachedProfile(user.id);

    if (silent || existingProfile) {
    setProfileRefreshing(true);
    } else {
    setProfileLoading(true);
    }

    setProfileError("");

    try {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (data) {
        writeCachedProfile(user.id, data);
    } else {
        clearCachedProfile(user.id);
    }

    setProfile(data);

    return data;
    } catch (error) {
    console.error(
        "Profile fetch failed:",
        error
    );

    setProfileError(
        error.message ||
        "Could not fetch profile."
    );

    return existingProfile || null;
    } finally {
    setProfileLoading(false);
    setProfileRefreshing(false);
    }
},
[user]
);

const saveProfile = async (profileData) => {
if (!user) {
    return null;
}

setProfileLoading(true);
setProfileError("");

try {
    const payload = {
    id: user.id,
    email: user.email,
    ...profileData,
    };

    const { data, error } = await supabase
    .from("profiles")
    .upsert(payload)
    .select()
    .single();

    if (error) {
    throw error;
    }

    writeCachedProfile(user.id, data);
    setProfile(data);

    return data;
} catch (error) {
    console.error(
    "Profile save failed:",
    error
    );

    setProfileError(
    error.message ||
        "Could not save profile."
    );

    return null;
} finally {
    setProfileLoading(false);
}
};

useEffect(() => {
if (!user) {
    setProfile(null);
    setProfileLoading(false);
    setProfileRefreshing(false);

    return;
}

const cached = readCachedProfile(user.id);

if (cached) {
    setProfile(cached);
    setProfileLoading(false);

    fetchProfile({
    silent: true,
    });
} else {
    fetchProfile();
}
}, [user, fetchProfile]);

return {
profile,
profileLoading,
profileRefreshing,
profileError,
fetchProfile,
saveProfile,
};
}

export default useProfile;