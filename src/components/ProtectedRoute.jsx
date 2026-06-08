import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children }) {
const { user, authLoading } = useAuth();

if (authLoading) {
return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 text-slate-300">
    Loading account...
    </div>
);
}

if (!user) {
return <Navigate to="/auth" replace />;
}

return children;
}

export default ProtectedRoute;