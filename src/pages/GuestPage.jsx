import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import JacketForm from "../components/JacketForm";

function GuestPage() {
const { user } = useAuth();

if (user) {
return <Navigate to="/app" replace />;
}

return (
<section>
    <div className="mb-6">
    <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
        Guest Mode
    </p>

    <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
        Do I need a jacket?
    </h1>

    <p className="mt-2 text-slate-400">
        Quick forecast check. No account needed.
    </p>
    </div>

    <JacketForm />
</section>
);
}

export default GuestPage;