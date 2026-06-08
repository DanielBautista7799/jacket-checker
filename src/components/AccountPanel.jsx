import AuthPanel from "./AuthPanel";
import ProfileForm from "./ProfileForm";
import PersonalizedJacketCheck from "./PersonalizedJacketCheck";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

function AccountPanel() {
const { user, authLoading, authError } = useAuth();

const { profile, profileLoading, profileError, saveProfile } =
useProfile(user);

if (authLoading) {
return (
    <section className="mt-8 border-t border-slate-800 pt-8">
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 text-slate-300">
        Loading account...
    </div>
    </section>
);
}

return (
<section className="mt-8 space-y-6 border-t border-slate-800 pt-8">
    <div>
    <p className="text-sm uppercase tracking-wide text-slate-400">
        Account Mode
    </p>

    <h2 className="mt-1 text-3xl font-bold text-white">
        Personalized Jacket Profile
    </h2>

    <p className="mt-2 text-slate-300">
        Create a profile to get recommendations based on your default
        location, cold tolerance, rain sensitivity, wind sensitivity, and
        usual time outside.
    </p>
    </div>

    {authError && (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {authError}
    </div>
    )}

    <AuthPanel user={user} />

    {user && (
    <>
        {profileError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {profileError}
        </div>
        )}

        <ProfileForm
        profile={profile}
        onSave={saveProfile}
        profileLoading={profileLoading}
        />

        {profile && <PersonalizedJacketCheck profile={profile} />}
    </>
    )}
</section>
);
}

export default AccountPanel;