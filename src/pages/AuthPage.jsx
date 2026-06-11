import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AuthPanel from "../components/AuthPanel";

function AuthPage() {
const { user } = useAuth();

if (user) {
return <Navigate to="/app" replace />;
}

return (
<section>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
        Account
    </p>

    <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Sign in or create account
    </h1>

    <p className="mt-2 text-slate-400">
        Save your profile for personalized checks.
    </p>
    </div>

    <AuthPanel />
</section>
);
}

export default AuthPage;