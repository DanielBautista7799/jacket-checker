import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CloudSun,
  History,
  Home,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Shirt,
  UserRound,
} from "lucide-react";

import useAuth from "../hooks/useAuth";
import useDeveloperAccess from "../hooks/useDeveloperAccess";
import { cn } from "../lib/utils";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

const accountLinks = [
  { to: "/app", label: "Today", icon: Home },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: UserRound },
];

function getInitials(email = "") {
  const value = String(email).trim();
  if (!value) return "JC";
  const local = value.split("@")[0] || value;
  const pieces = local.split(/[._-]+/).filter(Boolean);
  return (pieces.length > 1
    ? `${pieces[0][0]}${pieces[1][0]}`
    : local.slice(0, 2)
  ).toUpperCase();
}

function DesktopNavLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      viewTransition
      className={({ isActive }) =>
        cn(
          "relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20",
          isActive
            ? "bg-blue-400/14 text-sky-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.2),0_0_24px_rgba(34,211,238,0.08)]"
            : "text-slate-400 hover:bg-white/[0.055] hover:text-white",
        )
      }
    >
      {Icon && <Icon size={18} strokeWidth={2} aria-hidden="true" />}
      {label}
    </NavLink>
  );
}

function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile account navigation"
      className="bottom-nav-safe fixed inset-x-3 bottom-0 z-[60] lg:hidden"
    >
      <div className="glass-nav mx-auto grid max-w-lg grid-cols-4 rounded-[1.4rem] p-1.5 shadow-2xl">
        {accountLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            viewTransition
            className={({ isActive }) =>
              cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1rem] px-2 py-2 text-[0.68rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20",
                isActive
                  ? "bg-blue-400/14 text-sky-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200",
              )
            }
          >
            {createElement(icon, {
              size: 20,
              strokeWidth: 2,
              "aria-hidden": true,
            })}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const { isDeveloper } = useDeveloperAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const accountMenuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [compact, setCompact] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(false);
  const initials = useMemo(() => getInitials(user?.email), [user?.email]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setAccountMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  useEffect(() => {
    let previousY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        setCompact(currentY > 32);
        setScrollingDown(
          !reduceMotion && currentY > previousY && currentY > 120,
        );
        previousY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const success = await signOut();
    setSigningOut(false);
    if (success) navigate("/", { replace: true });
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-[transform,opacity,padding] duration-200",
          compact ? "pt-2" : "pt-3 sm:pt-4",
          scrollingDown && "-translate-y-2 opacity-90",
        )}
      >
        <div className={cn("page-container", user && "account-page-container")}>
          <div className="glass-nav relative flex min-h-[4rem] items-center justify-between gap-3 rounded-[var(--radius-nav)] px-2.5 py-2 sm:px-3">
            <Link
              to={user ? "/app" : "/"}
              viewTransition
              className="relative z-10 flex min-w-0 items-center gap-3 rounded-full px-1.5 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20"
              aria-label="JacketCheck home"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/15 bg-gradient-to-br from-blue-500/24 to-cyan-400/14 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.12)]">
                <CloudSun size={22} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="font-display block truncate text-base font-bold tracking-[-0.035em] text-white sm:text-lg">
                  JacketCheck
                </span>
                <span className="hidden text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">
                  Storm Glass
                </span>
              </span>
            </Link>

            {user ? (
              <nav
                aria-label="Primary navigation"
                className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
              >
                {accountLinks.map((link) => (
                  <DesktopNavLink key={link.to} {...link} />
                ))}
              </nav>
            ) : (
              <nav
                aria-label="Guest navigation"
                className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
              >
                <DesktopNavLink
                  to="/"
                  label="Guest check"
                  icon={CloudSun}
                />
              </nav>
            )}

            <div className="relative z-10 ml-auto flex items-center gap-2">
              {user ? (
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((current) => !current)}
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                    className="touch-target inline-flex items-center gap-2 rounded-full border border-slate-400/14 bg-white/[0.05] p-1.5 pr-2.5 text-sm font-extrabold text-slate-200 transition hover:border-slate-300/24 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20"
                  >
                    <span className="storm-on-accent flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-blue-400/20 text-xs text-white">
                      {initials}
                    </span>
                    <span className="hidden max-w-32 truncate sm:block">
                      Account
                    </span>
                    <ChevronDown
                      size={15}
                      className={cn(
                        "transition",
                        accountMenuOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {accountMenuOpen && (
                    <div
                      role="menu"
                      className="glass-nav absolute right-0 top-[calc(100%+0.65rem)] z-[70] w-64 rounded-[1.25rem] p-2 shadow-2xl"
                    >
                      <div className="border-b border-slate-400/12 px-3 py-3">
                        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
                          Signed in
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-white">
                          {user.email}
                        </p>
                      </div>

                      <NavLink
                        to="/profile"
                        viewTransition
                        role="menuitem"
                        className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <UserRound size={18} aria-hidden="true" />
                        Profile settings
                      </NavLink>

                      {isDeveloper && (
                        <NavLink
                          to="/dev/access"
                          viewTransition
                          role="menuitem"
                          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/10 hover:text-white"
                        >
                          <ShieldCheck size={18} aria-hidden="true" />
                          Developer tools
                        </NavLink>
                      )}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-slate-300 transition hover:bg-rose-400/10 hover:text-rose-100 disabled:opacity-50"
                      >
                        <LogOut size={18} aria-hidden="true" />
                        {signingOut ? "Signing out…" : "Sign out"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/auth"
                    viewTransition
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Log in
                  </Button>
                  <Button
                    as={Link}
                    to="/auth"
                    viewTransition
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Create account
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open navigation"
                    className="touch-target inline-flex items-center justify-center rounded-full border border-slate-400/14 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.08] sm:hidden"
                  >
                    <Menu size={20} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {!user && (
        <Modal
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Navigate"
          description="Run a quick check or open your account."
        >
          <div className="grid gap-3">
            <Button
              as={Link}
              to="/"
              viewTransition
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <CloudSun size={19} aria-hidden="true" />
              Guest check
            </Button>
            <Button
              as={Link}
              to="/auth"
              viewTransition
              variant="secondary"
              size="lg"
              className="w-full justify-start"
            >
              <LogIn size={19} aria-hidden="true" />
              Log in
            </Button>
            <Button
              as={Link}
              to="/auth"
              viewTransition
              size="lg"
              className="w-full"
            >
              Create account
            </Button>
          </div>
        </Modal>
      )}

      {user && <MobileBottomNav />}
    </>
  );
}
