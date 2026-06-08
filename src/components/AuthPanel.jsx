import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";

function AuthPanel() {
const { user } = useAuth();
const navigate = useNavigate();

const [mode, setMode] = useState("sign-in");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [authMessage, setAuthMessage] = useState("");
const [authError, setAuthError] = useState("");
const [loading, setLoading] = useState(false);

const handleAuth = async (e) => {
e.preventDefault();

setLoading(true);
setAuthError("");
setAuthMessage("");

try {
    if (mode === "sign-up") {
    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;

    setAuthMessage(
        "Account created. Check your email if confirmation is required, then sign in."
    );
    } else {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    navigate("/app");
    }
} catch (err) {
    setAuthError(err.message || "Authentication failed.");
} finally {
    setLoading(false);
}
};

if (user) {
return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
    <p className="text-sm text-slate-400">Signed in as</p>
    <p className="font-medium text-white">{user.email}</p>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
        type="button"
        onClick={() => navigate("/app")}
        className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400"
        >
        Go to Personalized App
        </button>

        <button
        type="button"
        onClick={() => navigate("/profile")}
        className="rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
        >
        Edit Profile
        </button>
    </div>
    </div>
);
}

return (
<div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
    <div className="mb-5 flex gap-2 rounded-xl bg-slate-900/70 p-1">
    <button
        type="button"
        onClick={() => setMode("sign-in")}
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        mode === "sign-in"
            ? "bg-sky-500 text-white"
            : "text-slate-300 hover:bg-slate-800"
        }`}
    >
        Sign In
    </button>

    <button
        type="button"
        onClick={() => setMode("sign-up")}
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        mode === "sign-up"
            ? "bg-sky-500 text-white"
            : "text-slate-300 hover:bg-slate-800"
        }`}
    >
        Create Account
    </button>
    </div>

    <form onSubmit={handleAuth} className="space-y-4">
    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Email
        </label>

        <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        required
        />
    </div>

    <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
        Password
        </label>

        <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
        required
        />
    </div>

    <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
    >
        {loading
        ? "Working..."
        : mode === "sign-up"
        ? "Create Account"
        : "Sign In"}
    </button>
    </form>

    {authMessage && (
    <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        {authMessage}
    </p>
    )}

    {authError && (
    <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
        {authError}
    </p>
    )}
</div>
);
}

export default AuthPanel;