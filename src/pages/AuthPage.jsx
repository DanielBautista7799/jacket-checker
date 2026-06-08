import AuthPanel from "../components/AuthPanel";

function AuthPage() {
return (
<section>
    <div className="mb-8">
    <p className="text-sm uppercase tracking-wide text-sky-400">
        Account Access
    </p>

    <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        Login or Create Account
    </h1>

    <p className="mt-3 text-slate-300">
        Create a profile to unlock personalized jacket recommendations.
    </p>
    </div>

    <AuthPanel />
</section>
);
}

export default AuthPage;