import { Link, NavLink, useNavigate } from "react-router-dom";
import { CloudSun, Home, LogIn, Settings, Sparkles, UserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";

function AppHeader() {
const { user } = useAuth();
const navigate = useNavigate();

const handleSignOut = async () => {
await supabase.auth.signOut();
navigate("/");
};

const linkClass = ({ isActive }) =>
`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
    : "text-slate-300 hover:bg-white/10 hover:text-white"
}`;

return (
<header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
    <Link to="/" className="flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
        <CloudSun size={24} />
    </div>

    <div>
        <p className="text-lg font-black tracking-tight text-white">
        JacketCheck
        </p>
        <p className="text-xs text-slate-400">Forecast-based outfit logic</p>
    </div>
    </Link>

    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
    <NavLink to="/" className={linkClass}>
        <Home size={16} />
        Guest
    </NavLink>

    {user ? (
        <>
        <NavLink to="/app" className={linkClass}>
            <Sparkles size={16} />
            Personalized
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
            <UserRound size={16} />
            Profile
        </NavLink>

        <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
            <Settings size={16} />
            Sign Out
        </button>
        </>
    ) : (
        <NavLink to="/auth" className={linkClass}>
        <LogIn size={16} />
        Login
        </NavLink>
    )}
    </nav>
</header>
);
}

export default AppHeader;