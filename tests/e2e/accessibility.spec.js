import { test, expect } from "@playwright/test";

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`guest page has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });
}

test("skip link and navigation are keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Skip to main content/i })).toBeFocused();
});

test("theme toggle is accessible and persists the selected mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("jacket-checker-theme", "dark");
  });

  await page.goto("/");
  const lightModeButton = page.getByRole("button", { name: "Switch to light mode" });
  await expect(lightModeButton).toBeVisible();
  await lightModeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
});
