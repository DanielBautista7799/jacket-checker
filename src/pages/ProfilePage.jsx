import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import DeleteAccountPanel from "../components/DeleteAccountPanel";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";

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
      <PageHeader
        eyebrow="Profile"
        title="Personal settings"
        description="Comfort, style, location, trend, and privacy settings tune the experience quietly in the background."
        className="mb-6"
      />

      {profileError && <div className="mb-5"><Alert tone="error">{profileError}</Alert></div>}
      {saved && <div className="mb-5"><Alert tone="success" title="Profile saved"><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} aria-hidden="true" />Your latest settings are active.</span></Alert></div>}

      <ProfileForm profile={profile} onSave={handleSave} profileLoading={profileLoading} />
      <DeleteAccountPanel />
    </section>
  );
}
