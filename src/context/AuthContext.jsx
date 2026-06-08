import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [session, setSession] = useState(null);
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [authError, setAuthError] = useState("");

useEffect(() => {
let isMounted = true;

async function loadAuth() {
    try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!isMounted) return;

    setSession(data.session);
    setUser(data.session?.user || null);
    } catch (err) {
    if (!isMounted) return;

    setAuthError(err.message || "Could not load auth.");
    setSession(null);
    setUser(null);
    } finally {
    if (isMounted) {
        setAuthLoading(false);
    }
    }
}

loadAuth();

const { data } = supabase.auth.onAuthStateChange(
    (_event, currentSession) => {
    if (!isMounted) return;

    setSession(currentSession);
    setUser(currentSession?.user || null);
    setAuthLoading(false);
    }
);

return () => {
    isMounted = false;
    data.subscription.unsubscribe();
};
}, []);

return (
<AuthContext.Provider
    value={{
    session,
    user,
    authLoading,
    authError,
    }}
>
    {children}
</AuthContext.Provider>
);
}