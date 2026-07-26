import { useState } from "react";
import {
  AtSign,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import {
  clearPendingAuthIntent,
  createAuthRedirectUrl,
} from "../utils/authRedirects";
import { getPasswordError } from "../utils/passwordPolicy";
import { changePasswordWithServerPolicy } from "../utils/passwordSecurityApi";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Input from "./ui/Input";
import PasswordRequirements from "./PasswordRequirements";

export default function AccountSecurityPanel({
  user,
}) {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [newEmail, setNewEmail] =
    useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [emailLoading, setEmailLoading] =
    useState(false);

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [emailMessage, setEmailMessage] =
    useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [emailError, setEmailError] =
    useState("");

  const handlePasswordChange = async (
    event,
  ) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    const validationError =
      getPasswordError(newPassword);

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "The new passwords do not match.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Choose a password that is different from your current password.",
      );
      return;
    }

    setPasswordLoading(true);

    try {
      await changePasswordWithServerPolicy({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully.",
      );
    } catch (error) {
      setPasswordError(
        error?.message ||
          "Could not change your password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (
    event,
  ) => {
    event.preventDefault();
    setEmailMessage("");
    setEmailError("");

    const normalizedEmail = newEmail
      .trim()
      .toLowerCase();

    if (
      !normalizedEmail ||
      normalizedEmail ===
        user.email?.toLowerCase()
    ) {
      setEmailError(
        "Enter a new email address that is different from your current email.",
      );
      return;
    }

    setEmailLoading(true);

    try {
      const emailRedirectTo =
        createAuthRedirectUrl(
          "/profile",
          "email-change",
        );

      const { data, error } =
        await supabase.auth.updateUser(
          {
            email: normalizedEmail,
          },
          {
            emailRedirectTo,
          },
        );

      if (error) {
        throw error;
      }

      setNewEmail("");

      const changedImmediately =
        data.user?.email?.toLowerCase() ===
        normalizedEmail;

      if (changedImmediately) {
        clearPendingAuthIntent();

        setEmailMessage(
          "Your sign-in email was changed successfully.",
        );

        return;
      }

      setEmailMessage(
        "Confirmation emails were requested. Follow the instructions sent by Supabase before the address changes.",
      );
    } catch (error) {
      clearPendingAuthIntent();

      setEmailError(
        error?.message ||
          "Could not start the email change.",
      );
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Card
      className="mt-6 p-5 sm:p-6"
      aria-labelledby="account-security-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.07] text-cyan-200">
          <KeyRound
            size={21}
            aria-hidden="true"
          />
        </span>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300/80">
            Account security
          </p>

          <h2
            id="account-security-title"
            className="font-display mt-1 text-2xl font-bold tracking-[-0.035em] text-white"
          >
            Email and password
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Keep your sign-in credentials
            current. Your wardrobe and
            developer role remain attached to
            the same Supabase user ID.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section
          className="rounded-[var(--radius-card)] border border-slate-400/12 bg-black/10 p-4 sm:p-5"
          aria-labelledby="change-password-title"
        >
          <div className="flex items-center gap-2">
            <LockKeyhole
              size={18}
              className="text-violet-300"
              aria-hidden="true"
            />

            <h3
              id="change-password-title"
              className="font-extrabold text-white"
            >
              Change password
            </h3>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="mt-5 space-y-4"
          >
            <label className="block text-sm font-bold text-slate-300">
              Current password

              <Input
                className="mt-2"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                required
              />
            </label>

            <label className="block text-sm font-bold text-slate-300">
              New password

              <Input
                className="mt-2"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                required
              />

              <PasswordRequirements
                password={newPassword}
              />
            </label>

            <label className="block text-sm font-bold text-slate-300">
              Confirm new password

              <Input
                className="mt-2"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                required
              />
            </label>

            <Button
              type="submit"
              loading={passwordLoading}
              loadingLabel="Changing password"
              className="w-full"
            >
              Change password
            </Button>
          </form>

          {passwordMessage && (
            <div className="mt-4">
              <Alert tone="success">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  {passwordMessage}
                </span>
              </Alert>
            </div>
          )}

          {passwordError && (
            <div className="mt-4">
              <Alert tone="error">
                {passwordError}
              </Alert>
            </div>
          )}
        </section>

        <section
          className="rounded-[var(--radius-card)] border border-slate-400/12 bg-black/10 p-4 sm:p-5"
          aria-labelledby="change-email-title"
        >
          <div className="flex items-center gap-2">
            <AtSign
              size={18}
              className="text-cyan-300"
              aria-hidden="true"
            />

            <h3
              id="change-email-title"
              className="font-extrabold text-white"
            >
              Change email
            </h3>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-400/10 bg-white/[0.025] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Current email
            </p>

            <p className="mt-1 break-all font-extrabold text-white">
              {user.email}
            </p>
          </div>

          <form
            onSubmit={handleEmailChange}
            className="mt-5 space-y-4"
          >
            <label className="block text-sm font-bold text-slate-300">
              New email address

              <span className="relative mt-2 block">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />

                <Input
                  className="pl-11"
                  type="email"
                  value={newEmail}
                  onChange={(event) =>
                    setNewEmail(
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <p className="text-xs leading-5 text-slate-500">
              Supabase may require confirmation
              from both your current and new
              address. Your sign-in email
              changes only after the required
              links are approved.
            </p>

            <Button
              type="submit"
              variant="secondary"
              loading={emailLoading}
              loadingLabel="Requesting email change"
              className="w-full"
            >
              Request email change
            </Button>
          </form>

          {emailMessage && (
            <div className="mt-4">
              <Alert tone="success">
                {emailMessage}
              </Alert>
            </div>
          )}

          {emailError && (
            <div className="mt-4">
              <Alert tone="error">
                {emailError}
              </Alert>
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}