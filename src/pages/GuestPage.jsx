import { Navigate } from "react-router-dom";
import { Zap } from "lucide-react";
import useAuth from "../hooks/useAuth";
import JacketForm from "../components/JacketForm";
import Badge from "../components/ui/Badge";

export default function GuestPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <section className="page-enter" aria-labelledby="guest-title">
      <div className="mb-6 max-w-3xl sm:mb-8">
        <Badge tone="info"><Zap size={14} aria-hidden="true" />Guest mode</Badge>
        <h1 id="guest-title" className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Do I need a jacket?</h1>
        <p className="mt-3 text-base leading-7 text-slate-400 sm:text-lg">Choose a location and time window for a fast YES or NO based on the forecast. No account required.</p>
      </div>
      <JacketForm />
    </section>
  );
}
