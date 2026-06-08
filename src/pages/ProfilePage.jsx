import ProfileForm from "../components/ProfileForm";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

function ProfilePage() {
const { user } = useAuth();
const { profile, profileLoading, profileError, saveProfile } =
useProfile(user);

return (
<section>
    <div className="mb-8">
    <p className="text-sm uppercase tracking-wide text-sky-400">
        Profile Setup
    </p>

    <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        Personalize Your Jacket Score
    </h1>

    <p className="mt-3 text-slate-300">
        Your profile is stored securely and used only to tune your personalized
        jacket recommendation.
    </p>
    </div>

    {profileError && (
    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {profileError}
    </div>
    )}

    <ProfileForm
    profile={profile}
    onSave={saveProfile}
    profileLoading={profileLoading}
    />
</section>
);
}

export default ProfilePage;