import process from "node:process";
import { expect, test } from "@playwright/test";

const runAuthenticated = process.env.RUN_AUTHENTICATED_SMOKE === "true";
const testEmail = process.env.PRODUCTION_TEST_EMAIL || "";
const testPassword = process.env.PRODUCTION_TEST_PASSWORD || "";
const smokeLocation = process.env.SMOKE_TEST_LOCATION || "Chapel Hill";

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("homepage returns production security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);

  const headers = response.headers();
  expect(headers["content-security-policy"] || "").toContain(
    "default-src 'self'"
  );
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
});

test("public pages and deep links load through HTTPS", async ({
  page,
  baseURL,
}) => {
  expect(new URL(baseURL).protocol).toBe("https:");

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Do I need a jacket?" })
  ).toBeVisible();

  await page.goto("/auth");
  await expect(
    page.getByRole("heading", { name: "Sign in or create account" })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("protected routes redirect signed-out users", async ({ page }) => {
  for (const route of ["/app", "/profile", "/wardrobe", "/history"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/auth$/);
    await expect(
      page.getByRole("heading", { name: "Sign in or create account" })
    ).toBeVisible();
  }
});

test("unknown deep links recover to the guest page", async ({ page }) => {
  await page.goto("/definitely-not-a-real-route");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Do I need a jacket?" })
  ).toBeVisible();
});

test("guest jacket check reaches a YES or NO result", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("combobox", { name: "Location" });
  await input.fill(smokeLocation);

  const suggestionList = page.getByRole("listbox", {
    name: "Location suggestions",
  });
  await expect(suggestionList).toBeVisible();

  const option = suggestionList.getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();

  await page.getByRole("button", { name: "Check jacket" }).click();
  await expect(
    page.getByRole("heading", { name: /^(YES|NO)$/ })
  ).toBeVisible({ timeout: 30_000 });
  await expectNoHorizontalOverflow(page);
});

test.describe("optional authenticated production smoke", () => {
  test.skip(
    !runAuthenticated,
    "Set RUN_AUTHENTICATED_SMOKE=true with disposable account credentials."
  );

  test.beforeEach(async ({ page }) => {
    test.skip(
      !testEmail || !testPassword,
      "Disposable production test credentials are required."
    );

    await page.goto("/auth");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test("authenticated routes render without exposing developer pages", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Personal settings" })
    ).toBeVisible();

    await page.goto("/wardrobe");
    await expect(
      page.getByRole("heading", { name: "Your saved jackets" })
    ).toBeVisible();

    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "Past recommendations" })
    ).toBeVisible();

    await page.goto("/dev/analytics");
    await expect(page).toHaveURL(/\/$/);
  });
});
