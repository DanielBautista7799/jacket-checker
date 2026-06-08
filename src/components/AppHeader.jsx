import { Link, NavLink, useNavigate } from "react-router-dom";
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
`rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
    ? "bg-sky-500 text-white"
    : "text-slate-300 hover:bg-slate-800 hover:text-white"
}`;

return (
<header className="mb-8 flex items-center justify-between gap-4">
    <Link to="/" className="text-lg font-black tracking-tight text-white">
    JacketCheck
    </Link>

    <nav className="flex items-center gap-2">
    <NavLink to="/" className={linkClass}>
        Guest
    </NavLink>

    {user ? (
        <>
        <NavLink to="/app" className={linkClass}>
            Personalized
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
            Profile
        </NavLink>

        <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
            Sign Out
        </button>
        </>
    ) : (
        <NavLink to="/auth" className={linkClass}>
        Login
        </NavLink>
    )}
    </nav>
</header>
);
}

export default AppHeader;