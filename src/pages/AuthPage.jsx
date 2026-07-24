import { Navigate } from "react-router";
import { CloudSun, ShieldCheck, Sparkles } from "lucide-react";
import useAuth from "../hooks/useAuth";
import AuthPanel from "../components/AuthPanel";
import Badge from "../components/ui/Badge";

export default function AuthPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <section className="page-enter mx-auto grid max-w-5xl gap-5 py-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch lg:py-10">
      <aside className="storm-glow hidden rounded-[var(--radius-hero)] border border-slate-400/12 bg-gradient-to-br from-blue-500/12 via-slate-950/70 to-violet-500/10 p-8 lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/14 bg-cyan-400/[0.08] text-cyan-100"><CloudSun size={25} aria-hidden="true" /></span>
          <Badge tone="purple" className="mt-8"><Sparkles size={13} aria-hidden="true" />Personalized mode</Badge>
          <h1 className="font-display mt-5 text-4xl font-bold tracking-[-0.05em] text-white">Your weather. Your jackets. One clear choice.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-400">Create an account to save your comfort profile, manage the jackets you own, and get a recommendation built around both.</p>
        </div>
        <div className="mt-10 flex items-center gap-3 text-sm font-bold text-slate-300"><ShieldCheck size={18} className="text-emerald-300" aria-hidden="true" />Private wardrobe images and user-scoped data</div>
      </aside>

      <div className="glass-nav rounded-[var(--radius-hero)] p-5 sm:p-7 lg:p-8">
        <div className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300/80">Account</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl">Sign in or create account</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Save your profile for personalized jacket checks.</p>
        </div>
        <AuthPanel />
      </div>
    </section>
  );
}
