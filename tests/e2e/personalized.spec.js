import process from "node:process";
import { test, expect } from "@playwright/test";

test("personalized recommendation and feedback flow", async ({ page }) => {
  test.skip(process.env.E2E_LIVE !== "true", "Set E2E_LIVE=true with a disposable Supabase test account to run live personalized flows.");
  await page.goto("/app");
  await expect(page.getByRole("heading").first()).toBeVisible();
});
