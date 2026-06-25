import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import useAuth from "../hooks/useAuth";
import JacketForm from "../components/JacketForm";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function GuestPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <section className="page-enter space-y-8" aria-labelledby="guest-title">
      <div className="storm-glow mx-auto flex w-full max-w-4xl flex-col items-center pt-4 text-center sm:pt-8">
        <Badge tone="info" className="w-fit"><Zap size={14} aria-hidden="true" />Guest mode</Badge>
        <h1 id="guest-title" className="font-display mx-auto mt-5 max-w-3xl text-balance text-5xl font-bold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Do I need a jacket?</h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-slate-400 sm:text-lg">Pick a location and forecast window. JacketCheck turns the weather into one clear YES or NO.</p>
      </div>

      <JacketForm />

      <Card className="mx-auto max-w-4xl p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200"><Sparkles size={19} aria-hidden="true" /></span>
          <div>
            <h2 className="text-lg font-bold text-white">Get recommendations based on how you dress.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Save your comfort profile and let the app choose the best jacket you already own.</p>
          </div>
        </div>
        <div className="mt-4 shrink-0 sm:mt-0">
          <Button as={Link} to="/auth" viewTransition variant="secondary">Create account <ArrowRight size={17} aria-hidden="true" /></Button>
        </div>
      </Card>

      <footer className="pb-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Forecast-aware. Jacket-first. No account required.</footer>
    </section>
  );
}
