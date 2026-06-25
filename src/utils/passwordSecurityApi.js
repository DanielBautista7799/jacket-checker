import { supabase } from "../lib/supabaseClient";

async function readFunctionError(error, data, fallback) {
  const directMessage = data?.error?.message || data?.message;
  if (directMessage) return directMessage;

  const response = error?.context;
  if (response && typeof response.clone === "function") {
    try {
      const payload = await response.clone().json();
      const responseMessage = payload?.error?.message || payload?.message;
      if (responseMessage) return responseMessage;
    } catch {
      // The response did not contain a readable JSON error payload.
    }
  }

  return error?.message || fallback;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token || "";
  if (!accessToken) {
    throw new Error("Your session has expired. Sign in again.");
  }

  return accessToken;
}

async function invokePasswordAction(action, payload, fallback) {
  const options = { body: { action, payload } };

  if (action !== "sign-up") {
    const accessToken = await getAccessToken();
    options.headers = { Authorization: `Bearer ${accessToken}` };
  }

  const { data, error } = await supabase.functions.invoke(
    "manage-password",
    options,
  );

  if (error || data?.success !== true) {
    throw new Error(await readFunctionError(error, data, fallback));
  }

  return data;
}

export async function signUpWithServerPasswordPolicy({
  email,
  password,
  emailRedirectTo,
}) {
  const data = await invokePasswordAction(
    "sign-up",
    { email, password, emailRedirectTo },
    "Account creation failed.",
  );

  if (data.session?.accessToken && data.session?.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: data.session.accessToken,
      refresh_token: data.session.refreshToken,
    });
    if (error) throw error;
  }

  return data;
}

export function changePasswordWithServerPolicy({
  currentPassword,
  newPassword,
}) {
  return invokePasswordAction(
    "change-password",
    { currentPassword, newPassword },
    "Could not change your password.",
  );
}

export function resetPasswordWithServerPolicy({ newPassword }) {
  return invokePasswordAction(
    "reset-password",
    { newPassword },
    "Could not reset your password.",
  );
}
