import { Navigate, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useDeveloperAccess from "../hooks/useDeveloperAccess";
import DeveloperNav from "./DeveloperNav";
import RecoverableErrorPanel from "./RecoverableErrorPanel";
import LoadingState from "./ui/LoadingState";

export default function DeveloperRoute({ children }) {
  const { user, authLoading, authError, refreshSession } = useAuth();
  const {
    isDeveloper,
    developerLoading,
    developerError,
    refreshDeveloperAccess,
  } = useDeveloperAccess();
  const location = useLocation();

  if (authLoading) return <LoadingState label="Loading account" rows={3} />;

  if (!user && authError) {
    return (
      <RecoverableErrorPanel
        title="Your account could not be loaded"
        message={authError}
        onRetry={refreshSession}
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (developerLoading) {
    return <LoadingState label="Verifying developer access" rows={3} />;
  }

  if (developerError) {
    return (
      <RecoverableErrorPanel
        title="Developer access could not be verified"
        message={developerError}
        onRetry={refreshDeveloperAccess}
      />
    );
  }

  if (!isDeveloper) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="space-y-6">
      <DeveloperNav />
      {children}
    </div>
  );
}
