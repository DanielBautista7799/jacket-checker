import { expect, test } from "@playwright/test";

test("protected routes redirect to sign in", async ({ page }) => {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: /Sign in or create account/i }),
  ).toBeVisible();
});

test("signed-out users cannot open developer routes", async ({ page }) => {
  for (const route of [
    "/dev/access",
    "/dev/scoring",
    "/dev/trends",
    "/dev/analytics",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: /Sign in or create account/i }),
    ).toBeVisible();
  }
});

test("account recovery controls are available", async ({ page }) => {
  await page.goto("/auth");

  await page.getByRole("button", { name: /Forgot password/i }).click();
  await expect(
    page.getByRole("heading", { name: /Reset your password/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Send recovery email/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Back to sign in/i }).click();
  await page.getByRole("button", { name: /Forgot email/i }).click();
  await expect(
    page.getByRole("heading", { name: /Find your account email/i }),
  ).toBeVisible();
  await expect(page.getByText(/cannot reveal account emails/i)).toBeVisible();
});

test("reset route rejects a missing recovery session", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/auth/reset-password", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/auth\/reset-password(?:[?#].*)?$/);

  const recoveryPage = page.getByTestId("password-reset-page");
  await expect(recoveryPage).toBeVisible();
  await expect(recoveryPage).toHaveAttribute(
    "data-recovery-state",
    "missing-session",
    { timeout: 15_000 },
  );

  await expect(
    page.getByRole("heading", { name: /Choose a new password/i }),
  ).toBeVisible();
  await expect(page.getByText(/Recovery link required/i)).toBeVisible();
  await expect(
    page.getByRole("form", { name: /Choose a new password/i }),
  ).toHaveCount(0);
});
