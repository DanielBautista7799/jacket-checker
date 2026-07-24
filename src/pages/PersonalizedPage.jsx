import { Link } from "react-router";
import { Sparkles, UserRound } from "lucide-react";

import PersonalizedJacketCheck from "../components/PersonalizedJacketCheck";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

export default function PersonalizedPage() {
  const { user } = useAuth();
  const { profile, profileLoading, profileRefreshing, profileError, fetchProfile } = useProfile(user);

  if (profileLoading && !profile) {
    return <LoadingState label="Loading your profile" rows={4} />;
  }

  if (profileError && !profile) {
    return <ErrorState title="Your profile could not be loaded" message={profileError} onRetry={() => fetchProfile({ force: true })} />;
  }

  if (!profile) {
    return (
      <section className="page-enter" aria-labelledby="profile-required-title">
        <EmptyState
          icon={UserRound}
          title="Set up your profile first"
          description="Personalized mode needs your default location, comfort preferences, and style before it can recommend one of your jackets."
          action={
            <Button as={Link} to="/profile" size="lg">
              Create profile <Sparkles size={18} aria-hidden="true" />
            </Button>
          }
        />
        <h1 id="profile-required-title" className="sr-only">Set up your profile first</h1>
      </section>
    );
  }

  return (
    <>
      {profileRefreshing && <div className="mb-3 text-right text-xs font-bold text-slate-500" role="status">Syncing profile…</div>}
      <PersonalizedJacketCheck profile={profile} />
    </>
  );
}
