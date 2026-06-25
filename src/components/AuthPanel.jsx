import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  Mail,
  Search,
  UserPlus,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import { getPasswordError } from "../utils/passwordPolicy";
import { signUpWithServerPasswordPolicy } from "../utils/passwordSecurityApi";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Input from "./ui/Input";
import PasswordRequirements from "./PasswordRequirements";

const GENERIC_RECOVERY_MESSAGE =
  "If an account matches that email, JacketCheck sent recovery instructions. Check spam and promotions too.";

export default function AuthPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetFeedback = () => {
    setAuthMessage("");
    setAuthError("");
  };

  const changeMode = (nextMode) => {
    resetFeedback();
    setPassword("");
    setMode(nextMode);
  };

  const sendRecoveryEmail = async () => {
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) throw error;
    setAuthMessage(GENERIC_RECOVERY_MESSAGE);
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetFeedback();

    try {
      if (mode === "forgot-password" || mode === "forgot-email") {
        await sendRecoveryEmail();
        return;
      }

      if (mode === "sign-up") {
        const passwordError = getPasswordError(password);
        if (passwordError) throw new Error(passwordError);

        const result = await signUpWithServerPasswordPolicy({
          email: email.trim(),
          password,
          emailRedirectTo: `${window.location.origin}/app`,
        });
        setAuthMessage(
          result.confirmationRequired
            ? "Account created. Check your email to confirm the account, then sign in."
            : "Account created. Your secure session is ready.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate("/app");
      }
    } catch (error) {
      setAuthError(error?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="rounded-[var(--radius-card)] border border-emerald-300/18 bg-emerald-400/[0.055] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200">
            <CheckCircle2 size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Signed in as</p>
            <p className="mt-1 font-extrabold text-white">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={() => navigate("/app")}>Personalized app <ArrowRight size={17} aria-hidden="true" /></Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>Account settings</Button>
        </div>
      </div>
    );
  }

  const isRecovery = mode === "forgot-password" || mode === "forgot-email";

  return (
    <div>
      {!isRecovery && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-400/12 bg-black/15 p-1">
          <button type="button" onClick={() => changeMode("sign-in")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${mode === "sign-in" ? "bg-blue-400/14 text-sky-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,.18)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}><LockKeyhole size={16} aria-hidden="true" />Sign in</button>
          <button type="button" onClick={() => changeMode("sign-up")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${mode === "sign-up" ? "bg-violet-400/14 text-violet-100 shadow-[inset_0_0_0_1px_rgba(167,139,250,.18)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}><UserPlus size={16} aria-hidden="true" />Create account</button>
        </div>
      )}

      {isRecovery && (
        <div className="mb-6">
          <button type="button" onClick={() => changeMode("sign-in")} className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
          </button>
          <div className="mt-5 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.07] text-cyan-200">
              {mode === "forgot-password" ? <KeyRound size={21} aria-hidden="true" /> : <Search size={21} aria-hidden="true" />}
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-[-0.035em] text-white">
                {mode === "forgot-password" ? "Reset your password" : "Find your account email"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {mode === "forgot-password"
                  ? "Enter your account email and we will send a secure reset link."
                  : "For privacy, JacketCheck cannot reveal account emails. Enter an email you may have used; recovery instructions are sent only when it matches an account."}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-5">
        <label className="block text-sm font-extrabold text-slate-200">
          {mode === "forgot-email" ? "Possible account email" : "Email"}
          <span className="relative mt-2 block">
            <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-11" autoComplete="email" required />
          </span>
        </label>

        {!isRecovery && (
          <label className="block text-sm font-extrabold text-slate-200">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-11" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} required />
            </span>
            {mode === "sign-up" && <PasswordRequirements password={password} />}
          </label>
        )}

        <Button type="submit" size="lg" loading={loading} loadingLabel={isRecovery ? "Sending recovery email" : mode === "sign-up" ? "Creating account" : "Signing in"} className="w-full">
          {isRecovery ? "Send recovery email" : mode === "sign-up" ? "Create account" : "Sign in"}
          {!loading && <ArrowRight size={18} aria-hidden="true" />}
        </Button>
      </form>

      {mode === "sign-in" && (
        <div className="mt-5 grid gap-2 border-t border-slate-400/10 pt-5 sm:grid-cols-2">
          <button type="button" onClick={() => changeMode("forgot-password")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-cyan-300 transition hover:bg-cyan-400/[0.06] hover:text-cyan-100">
            <KeyRound size={16} aria-hidden="true" /> Forgot password?
          </button>
          <button type="button" onClick={() => changeMode("forgot-email")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
            <HelpCircle size={16} aria-hidden="true" /> Forgot email?
          </button>
        </div>
      )}

      {authMessage && <div className="mt-5"><Alert tone="success">{authMessage}</Alert></div>}
      {authError && <div className="mt-5"><Alert tone="error">{authError}</Alert></div>}

      {isRecovery && (
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Recovery responses stay intentionally generic so nobody can use this form to discover registered accounts. <Link to="/" className="font-bold text-slate-300 hover:text-white">Return to guest mode</Link>
        </p>
      )}
    </div>
  );
}
