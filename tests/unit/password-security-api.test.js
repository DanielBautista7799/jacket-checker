import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      setSession: mocks.setSession,
    },
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

import {
  changePasswordWithServerPolicy,
  resetPasswordWithServerPolicy,
  signUpWithServerPasswordPolicy,
} from "../../src/utils/passwordSecurityApi";

describe("password security API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
      error: null,
    });
    mocks.setSession.mockResolvedValue({ error: null });
  });

  it("routes signup through the manage-password function and stores a returned session", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        success: true,
        confirmationRequired: false,
        session: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        },
      },
      error: null,
    });

    const result = await signUpWithServerPasswordPolicy({
      email: "user@example.com",
      password: "Aa1!bc",
      emailRedirectTo: "https://jacketchecker.netlify.app/app",
    });

    expect(mocks.invoke).toHaveBeenCalledWith("manage-password", {
      body: {
        action: "sign-up",
        payload: {
          email: "user@example.com",
          password: "Aa1!bc",
          emailRedirectTo: "https://jacketchecker.netlify.app/app",
        },
      },
    });
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
    });
    expect(result.confirmationRequired).toBe(false);
  });

  it("sends authenticated password changes with the current access token", async () => {
    mocks.invoke.mockResolvedValue({
      data: { success: true, action: "change-password" },
      error: null,
    });

    await changePasswordWithServerPolicy({
      currentPassword: "Old1!x",
      newPassword: "New2@y",
    });

    expect(mocks.invoke).toHaveBeenCalledWith("manage-password", {
      body: {
        action: "change-password",
        payload: {
          currentPassword: "Old1!x",
          newPassword: "New2@y",
        },
      },
      headers: { Authorization: "Bearer test-access-token" },
    });
  });

  it("surfaces safe server messages for rejected recovery changes", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        success: false,
        error: { message: "Use a valid password-reset email first." },
      },
      error: new Error("Edge Function returned an error"),
    });

    await expect(
      resetPasswordWithServerPolicy({ newPassword: "Aa1!bc" }),
    ).rejects.toThrow("Use a valid password-reset email first.");
  });
});
