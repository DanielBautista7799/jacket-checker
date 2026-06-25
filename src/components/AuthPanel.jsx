import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function AuthPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setAuthError("");
    setAuthMessage("");
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage("Account created. Check your email if confirmation is required, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app");
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="rounded-[var(--radius-card)] border border-emerald-300/18 bg-emerald-400/[0.055] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200"><CheckCircle2 size={22} aria-hidden="true" /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Signed in as</p><p className="mt-1 font-extrabold text-white">{user.email}</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={() => navigate("/app")}>Personalized app <ArrowRight size={17} aria-hidden="true" /></Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>Edit profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-400/12 bg-black/15 p-1">
        <button type="button" onClick={() => setMode("sign-in")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${mode === "sign-in" ? "bg-blue-400/14 text-sky-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,.18)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}><LockKeyhole size={16} aria-hidden="true" />Sign in</button>
        <button type="button" onClick={() => setMode("sign-up")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${mode === "sign-up" ? "bg-violet-400/14 text-violet-100 shadow-[inset_0_0_0_1px_rgba(167,139,250,.18)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}><UserPlus size={16} aria-hidden="true" />Create account</button>
      </div>

      <form onSubmit={handleAuth} className="space-y-5">
        <label className="block text-sm font-extrabold text-slate-200">Email
          <span className="relative mt-2 block"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500" aria-hidden="true" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-11" autoComplete="email" required /></span>
        </label>
        <label className="block text-sm font-extrabold text-slate-200">Password
          <span className="relative mt-2 block"><LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500" aria-hidden="true" /><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-11" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} required /></span>
        </label>
        <Button type="submit" size="lg" loading={loading} loadingLabel={mode === "sign-up" ? "Creating account" : "Signing in"} className="w-full">
          {mode === "sign-up" ? "Create account" : "Sign in"}{!loading && <ArrowRight size={18} aria-hidden="true" />}
        </Button>
      </form>

      {authMessage && <div className="mt-5"><Alert tone="success">{authMessage}</Alert></div>}
      {authError && <div className="mt-5"><Alert tone="error">{authError}</Alert></div>}
    </div>
  );
}
