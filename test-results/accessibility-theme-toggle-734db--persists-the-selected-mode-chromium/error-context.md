# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.js >> theme toggle is accessible and persists the selected mode
- Location: tests/e2e/accessibility.spec.js:18:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('html')
Expected: "light"
Received: "dark"
Timeout:  8000ms

Call log:
  - Expect "toHaveAttribute" with timeout 8000ms
  - waiting for locator('html')
    19 × locator resolved to <html lang="en" data-theme="dark">…</html>
       - unexpected value "dark"

```

```yaml
- document:
  - link "Skip to main content":
    - /url: "#main-content"
  - text: Guest jacket check
  - banner
  - button "Switch to light mode": Light
  - main
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | for (const width of [320, 375, 430, 768, 1024, 1440]) {
  4  |   test(`guest page has no horizontal overflow at ${width}px`, async ({ page }) => {
  5  |     await page.setViewportSize({ width, height: 900 });
  6  |     await page.goto("/");
  7  |     const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  8  |     expect(overflow).toBe(false);
  9  |   });
  10 | }
  11 | 
  12 | test("skip link and navigation are keyboard accessible", async ({ page }) => {
  13 |   await page.goto("/");
  14 |   await page.keyboard.press("Tab");
  15 |   await expect(page.getByRole("link", { name: /Skip to main content/i })).toBeFocused();
  16 | });
  17 | 
  18 | test("theme toggle is accessible and persists the selected mode", async ({ page }) => {
  19 |   await page.addInitScript(() => {
  20 |     window.localStorage.setItem("jacket-checker-theme", "dark");
  21 |   });
  22 | 
  23 |   await page.goto("/");
  24 |   const lightModeButton = page.getByRole("button", { name: "Switch to light mode" });
  25 |   await expect(lightModeButton).toBeVisible();
  26 |   await lightModeButton.click();
  27 |   await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  28 | 
  29 |   await page.reload();
> 30 |   await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
     |                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  31 |   await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  32 | });
  33 | 
```