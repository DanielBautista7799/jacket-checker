import JacketForm from "./components/JacketForm";

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Should I Wear a Jacket?
        </h1>
        <p className="text-slate-300 mb-8">
          Personalized jacket recommendations based on weather and your habits.
        </p>
        <JacketForm />
      </div>
    </main>
  );
}

export default App;