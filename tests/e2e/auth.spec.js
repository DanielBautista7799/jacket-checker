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
