import { Link } from "react-router-dom";
import { Sparkles, UserRound } from "lucide-react";
import PersonalizedJacketCheck from "../components/PersonalizedJacketCheck";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

function PersonalizedPage() {
const { user } = useAuth();
const { profile, profileLoading, profileError } = useProfile(user);

if (profileLoading) {
return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-300">
    Loading your profile...
    </div>
);
}

if (profileError) {
return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
    {profileError}
    </div>
);
}

if (!profile) {
return (
    <section>
    <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">
        <UserRound size={15} />
        Personalized Mode
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
        Set up your profile first.
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-300">
        The personalized version needs your default location and comfort
        preferences before it can run.
        </p>
    </div>

    <Link
        to="/profile"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
    >
        Create Profile
        <Sparkles size={18} />
    </Link>
    </section>
);
}

return <PersonalizedJacketCheck profile={profile} />;
}

export default PersonalizedPage;