import JacketForm from "../components/JacketForm";

function GuestPage() {
return (
<section>
    <div className="mb-8">
    <p className="text-sm uppercase tracking-wide text-sky-400">
        Guest Mode
    </p>

    <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        Should I Wear a Jacket?
    </h1>

    <p className="mt-3 text-slate-300">
        Fast forecast-based jacket advice without creating an account.
    </p>
    </div>

    <JacketForm />
</section>
);
}

export default GuestPage;