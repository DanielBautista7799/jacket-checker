import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LoadingState from "./ui/LoadingState";
import RecoverableErrorPanel from "./RecoverableErrorPanel";

export default function ProtectedRoute({ children }) {
  const { user, authLoading, authError, refreshSession } = useAuth();
  const location = useLocation();

  if (authLoading) return <LoadingState label="Loading account" rows={3} />;
  if (!user && authError) {
    return <RecoverableErrorPanel title="Your account could not be loaded" message={authError} onRetry={refreshSession} />;
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return children;
}
