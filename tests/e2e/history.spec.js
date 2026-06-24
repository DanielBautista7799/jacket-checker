import process from "node:process";
import { test } from "@playwright/test";

test("history deletion and feedback reversal", async ({ page }) => {
  test.skip(process.env.E2E_LIVE !== "true", "Set E2E_LIVE=true with a disposable Supabase test account to run live history flows.");
  await page.goto("/history");
});
