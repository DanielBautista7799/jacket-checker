import { test, expect } from "@playwright/test";

test("protected routes redirect to sign in", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: /Sign in or create account/i })).toBeVisible();
});
