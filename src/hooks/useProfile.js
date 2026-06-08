import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function useProfile(user) {
const [profile, setProfile] = useState(null);
const [profileLoading, setProfileLoading] = useState(false);
const [profileError, setProfileError] = useState("");

const fetchProfile = async () => {
if (!user) {
    setProfile(null);
    return null;
}

setProfileLoading(true);
setProfileError("");

try {
    const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

    if (error) throw error;

    setProfile(data);
    return data;
} catch (err) {
    setProfileError(err.message || "Could not fetch profile.");
    return null;
} finally {
    setProfileLoading(false);
}
};

const saveProfile = async (profileData) => {
if (!user) return null;

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

    if (error) throw error;

    setProfile(data);
    return data;
} catch (err) {
    setProfileError(err.message || "Could not save profile.");
    return null;
} finally {
    setProfileLoading(false);
}
};

useEffect(() => {
fetchProfile();
}, [user]);

return {
profile,
profileLoading,
profileError,
fetchProfile,
saveProfile,
};
}

export default useProfile;