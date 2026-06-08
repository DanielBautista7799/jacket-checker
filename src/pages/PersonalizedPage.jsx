import { Link } from "react-router-dom";
import PersonalizedJacketCheck from "../components/PersonalizedJacketCheck";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

function PersonalizedPage() {
const { user } = useAuth();
const { profile, profileLoading, profileError } = useProfile(user);

if (profileLoading) {
return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 text-slate-300">
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
        <p className="text-sm uppercase tracking-wide text-sky-400">
        Personalized Mode
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        Set Up Your Profile First
        </h1>

        <p className="mt-3 text-slate-300">
        The personalized version needs your default location and comfort
        preferences before it can run.
        </p>
    </div>

    <Link
        to="/profile"
        className="block rounded-xl bg-sky-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-400"
    >
        Create Profile
    </Link>
    </section>
);
}

return <PersonalizedJacketCheck profile={profile} />;
}

export default PersonalizedPage;