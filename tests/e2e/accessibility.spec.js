import { test, expect } from "@playwright/test";

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`guest page has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);

    if (width === 1440) {
      const navigation = page.locator("header .glass-nav");
      const forecastForm = page
        .getByText("Set your forecast", { exact: true })
        .locator("..");
      const recommendationColumn = page.locator(
        '.guest-check-layout > [aria-live="polite"]',
      );

      await expect(navigation).toBeVisible();
      await expect(forecastForm).toBeVisible();
      await expect(recommendationColumn).toBeVisible();

      const navigationBox = await navigation.boundingBox();
      const formBox = await forecastForm.boundingBox();
      const recommendationBox = await recommendationColumn.boundingBox();

      expect(navigationBox).not.toBeNull();
      expect(formBox).not.toBeNull();
      expect(recommendationBox).not.toBeNull();

      const navigationLeft = navigationBox.x;
      const navigationRight = navigationBox.x + navigationBox.width;
      const tolerance = 2;

      expect(formBox.x).toBeGreaterThanOrEqual(navigationLeft - tolerance);
      expect(recommendationBox.x + recommendationBox.width).toBeLessThanOrEqual(
        navigationRight + tolerance,
      );
    }
  });
}

test("skip link and navigation are keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).not.toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: /Skip to main content/i }),
  ).toBeFocused();
});

test("theme toggle is accessible and persists the selected mode", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("jacket-checker-theme", "dark");
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const lightModeButton = page.getByRole("button", {
    name: "Switch to light mode",
  });
  await expect(lightModeButton).toBeVisible();
  await lightModeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "Switch to dark mode" }),
  ).toBeVisible();
});
