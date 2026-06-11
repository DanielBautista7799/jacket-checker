import { ArrowRight, CloudSun, MapPin, Sparkles } from "lucide-react";
import JacketForm from "../components/JacketForm";

function GuestPage() {
return (
<section>
    <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
    <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">
        <Sparkles size={15} />
        Guest Mode
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
        Should I Wear a Jacket?
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-300">
        Get a fast jacket verdict using your location, current weather, and
        forecast trends throughout the day.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
            <MapPin size={16} className="text-sky-300" />
            Exact location
        </span>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
            <CloudSun size={16} className="text-amber-300" />
            Forecast-aware
        </span>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
            <ArrowRight size={16} className="text-emerald-300" />
            One clean verdict
        </span>
        </div>
    </div>

    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        What it checks
        </p>

        <div className="mt-4 space-y-3 text-sm text-slate-300">
        <p>• Feels-like temperature</p>
        <p>• Rain and wind risk</p>
        <p>• Time-window forecast changes</p>
        <p>• Bring-along layer suggestions</p>
        </div>
    </div>
    </div>

    <JacketForm />
</section>
);
}

export default GuestPage;