import ProfileForm from "../components/ProfileForm";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

function ProfilePage() {
const { user } = useAuth();
const { profile, profileLoading, profileError, saveProfile } =
useProfile(user);

return (
<section>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
        Profile
    </p>

    <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Personal settings
    </h1>

    <p className="mt-2 text-slate-400">
        Used quietly in the background to tune your result.
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