import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserPlus } from "lucide-react";
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
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl">
    <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
        <CheckCircle2 size={24} />
        </div>

        <div>
        <p className="text-sm text-slate-400">Signed in as</p>
        <p className="font-bold text-white">{user.email}</p>
        </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
        <button
        type="button"
        onClick={() => navigate("/app")}
        className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
        >
        Personalized App
        <ArrowRight size={18} />
        </button>

        <button
        type="button"
        onClick={() => navigate("/profile")}
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-black text-white transition hover:bg-white/[0.08]"
        >
        Edit Profile
        </button>
    </div>
    </div>
);
}

return (
<div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl">
    <div className="mb-5 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
    <button
        type="button"
        onClick={() => setMode("sign-in")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
        mode === "sign-in"
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
            : "text-slate-300 hover:bg-white/10"
        }`}
    >
        <LockKeyhole size={16} />
        Sign In
    </button>

    <button
        type="button"
        onClick={() => setMode("sign-up")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
        mode === "sign-up"
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
            : "text-slate-300 hover:bg-white/10"
        }`}
    >
        <UserPlus size={16} />
        Create Account
    </button>
    </div>

    <form onSubmit={handleAuth} className="space-y-4">
    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Email
        </label>

        <div className="relative">
        <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 pl-11 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10"
            required
        />
        </div>
    </div>

    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
        Password
        </label>

        <div className="relative">
        <LockKeyhole
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 pl-11 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10"
            required
        />
        </div>
    </div>

    <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
    >
        {loading
        ? "Working..."
        : mode === "sign-up"
        ? "Create Account"
        : "Sign In"}
        {!loading && <ArrowRight size={18} />}
    </button>
    </form>

    {authMessage && (
    <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        {authMessage}
    </p>
    )}

    {authError && (
    <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {authError}
    </p>
    )}
</div>
);
}

export default AuthPanel;