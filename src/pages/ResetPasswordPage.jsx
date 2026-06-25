import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";

import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PasswordRequirements from "../components/PasswordRequirements";
import useAuth from "../hooks/useAuth";
import { getPasswordError } from "../utils/passwordPolicy";
import { resetPasswordWithServerPolicy } from "../utils/passwordSecurityApi";

function hasRecoveryUrlEvidence() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    search.get("type") === "recovery" ||
    hash.get("type") === "recovery" ||
    search.has("code") ||
    search.has("token_hash") ||
    hash.has("access_token")
  );
}

export default function ResetPasswordPage() {
  const { session, authLoading, authEvent } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recoveryDetected = useMemo(
    () => authEvent === "PASSWORD_RECOVERY" || hasRecoveryUrlEvidence(),
    [authEvent],
  );
  const ready = !authLoading && recoveryDetected && Boolean(session);
  const missingRecoverySession = !authLoading && !ready;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithServerPolicy({ newPassword: password });

      setPassword("");
      setConfirmation("");
      setMessage("Your password has been changed. Redirecting to your account...");
      window.setTimeout(() => navigate("/app", { replace: true }), 1800);
    } catch (updateError) {
      setError(
        updateError?.message ||
          "Could not update your password. Request a new reset link and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="page-enter mx-auto max-w-xl py-6 sm:py-12"
      aria-labelledby="reset-password-title"
      data-testid="password-reset-page"
      data-recovery-state={
        authLoading ? "checking" : ready ? "ready" : "missing-session"
      }
    >
      <div className="glass-nav rounded-[var(--radius-hero)] p-5 sm:p-8">
        <Badge tone="info">
          <KeyRound size={13} aria-hidden="true" />
          Account recovery
        </Badge>

        <h1
          id="reset-password-title"
          className="font-display mt-5 text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl"
        >
          Choose a new password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Use a unique password that you do not use on any other site.
        </p>

        {authLoading && (
          <div className="mt-6">
            <Alert>Checking your secure recovery link...</Alert>
          </div>
        )}

        {missingRecoverySession && (
          <div className="mt-6 space-y-4">
            <Alert tone="warning" title="Recovery link required">
              This page needs a valid password-reset link. The link may have
              expired or already been used.
            </Alert>
            <Button asChild className="w-full">
              <Link to="/auth">Request another reset email</Link>
            </Button>
          </div>
        )}

        {ready && (
          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
            aria-label="Choose a new password"
          >
            <label className="block text-sm font-extrabold text-slate-200">
              New password
              <span className="relative mt-2 block">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-11"
                  autoComplete="new-password"
                  required
                />
              </span>
              <PasswordRequirements password={password} />
            </label>

            <label className="block text-sm font-extrabold text-slate-200">
              Confirm new password
              <span className="relative mt-2 block">
                <CheckCircle2
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="pl-11"
                  autoComplete="new-password"
                  required
                />
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              loadingLabel="Updating password"
              className="w-full"
            >
              Update password
            </Button>
          </form>
        )}

        {message && (
          <div className="mt-5">
            <Alert tone="success">{message}</Alert>
          </div>
        )}

        {error && (
          <div className="mt-5">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </div>
    </section>
  );
}
