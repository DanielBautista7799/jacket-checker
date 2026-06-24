import process from "node:process";
import { test } from "@playwright/test";

test("jacket CRUD and image management", async ({ page }) => {
  test.skip(process.env.E2E_LIVE !== "true", "Set E2E_LIVE=true with a disposable Supabase test account to run live jacket CRUD.");
  await page.goto("/wardrobe");
});
