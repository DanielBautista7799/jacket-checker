import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CloudSun, History, LogIn, Menu, Shirt, UserRound, X } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";

const linkClass = ({ isActive }) =>
  `flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/30 ${
    isActive
      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="relative z-20 mb-4 rounded-3xl border border-white/10 bg-slate-950/70 p-3 shadow-xl backdrop-blur-xl sm:mb-6 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <Link to={user ? "/app" : "/"} className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/30" aria-label="JacketCheck home">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
            <CloudSun size={23} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black tracking-tight text-white">JacketCheck</span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">Weather, jackets, and style</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="touch-target inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/10 lg:hidden"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav id="primary-navigation" aria-label="Primary navigation" className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 lg:flex">
          {user ? (
            <>
              <NavLink to="/app" className={linkClass} onClick={() => setOpen(false)}>App</NavLink>
              <NavLink to="/wardrobe" className={linkClass} onClick={() => setOpen(false)}><Shirt size={16} aria-hidden="true" />Jackets</NavLink>
              <NavLink to="/history" className={linkClass} onClick={() => setOpen(false)}><History size={16} aria-hidden="true" />History</NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />Profile</NavLink>
              <button type="button" onClick={handleSignOut} className="min-h-11 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/30">Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}><Shirt size={16} aria-hidden="true" />Guest</NavLink>
              <NavLink to="/auth" className={linkClass} onClick={() => setOpen(false)}><LogIn size={16} aria-hidden="true" />Create account</NavLink>
            </>
          )}
        </nav>
      </div>

      {open && (
        <nav aria-label="Mobile navigation" className="mt-3 grid gap-2 border-t border-white/10 pt-3 lg:hidden">
          {user ? (
            <>
              <NavLink to="/app" className={linkClass} onClick={() => setOpen(false)}>App</NavLink>
              <NavLink to="/wardrobe" className={linkClass} onClick={() => setOpen(false)}><Shirt size={16} aria-hidden="true" />Jackets</NavLink>
              <NavLink to="/history" className={linkClass} onClick={() => setOpen(false)}><History size={16} aria-hidden="true" />History</NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />Profile</NavLink>
              <button type="button" onClick={handleSignOut} className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}><Shirt size={16} aria-hidden="true" />Guest</NavLink>
              <NavLink to="/auth" className={linkClass} onClick={() => setOpen(false)}><LogIn size={16} aria-hidden="true" />Create account</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
