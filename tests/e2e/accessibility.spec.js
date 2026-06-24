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
