import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import DeleteAccountPanel from "../components/DeleteAccountPanel";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import Alert from "../components/ui/Alert";

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, profileLoading, profileError, saveProfile } = useProfile(user);
  const [saved, setSaved] = useState(false);

  const handleSave = async (values) => {
    const result = await saveProfile(values);
    setSaved(Boolean(result));
    if (result) window.setTimeout(() => setSaved(false), 3500);
    return result;
  };

  return (
    <section className="page-enter" aria-labelledby="profile-title">
      <div className="mb-6 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-300">Profile</p>
        <h1 id="profile-title" className="mt-2 text-4xl font-black tracking-tight text-white">Personal settings</h1>
        <p className="mt-3 text-slate-400">Comfort, style, location, trend, and privacy settings tune the experience quietly in the background.</p>
      </div>

      {profileError && <div className="mb-5"><Alert tone="error">{profileError}</Alert></div>}
      {saved && <div className="mb-5"><Alert tone="success" title="Profile saved"><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} aria-hidden="true" />Your latest settings are active.</span></Alert></div>}

      <ProfileForm profile={profile} onSave={handleSave} profileLoading={profileLoading} />
      <DeleteAccountPanel />
    </section>
  );
}
