import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import {
    CloudSun,
    History,
    LogIn,
    Shirt,
    UserRound,
} from "lucide-react";

function AppHeader() {
const { user } = useAuth();
const navigate = useNavigate();

const handleSignOut = async () => {
await supabase.auth.signOut();
navigate("/");
};

const linkClass = ({ isActive }) =>
`rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
    ? "bg-sky-500 text-white"
    : "text-slate-300 hover:bg-white/10 hover:text-white"
}`;

return (
<header className="mb-6 flex items-center justify-between gap-4">
    <Link to={user ? "/app" : "/"} className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white">
        <CloudSun size={22} />
    </div>

    <p className="text-lg font-black tracking-tight text-white">
        JacketCheck
    </p>
    </Link>

    <nav className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
    {user ? (
        <>
        <NavLink to="/app" className={linkClass}>
            App
        </NavLink>

        <NavLink to="/closet" className={linkClass}>
            <Shirt size={15} className="inline" />
            <span className="ml-1">Closet</span>
        </NavLink>
        
        <NavLink to="/history" className={linkClass}>
        <History size={15} className="inline" />
        <span className="ml-1">History</span>
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
            <UserRound size={15} className="inline" />
            <span className="ml-1">Profile</span>
        </NavLink>

        <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
            Sign Out
        </button>
        </>
    ) : (
        <>
        <NavLink to="/" className={linkClass}>
            <Shirt size={15} className="inline" />
            <span className="ml-1">Guest</span>
        </NavLink>

        <NavLink to="/auth" className={linkClass}>
            <LogIn size={15} className="inline" />
            <span className="ml-1">Create Account</span>
        </NavLink>
        </>
    )}
    </nav>
</header>
);
}

export default AppHeader;