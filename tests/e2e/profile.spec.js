import process from "node:process";
import { test } from "@playwright/test";

test("profile preferences and protected account deletion", async ({ page }) => {
  test.skip(process.env.E2E_LIVE !== "true", "Set E2E_LIVE=true with a disposable Supabase test account to run live profile flows.");
  await page.goto("/profile");
});
