import { test, expect } from "@playwright/test";

const weatherPayload = {
  success: true,
  weather: {
    city: "Chapel Hill",
    region: "North Carolina",
    country: "United States",
    localTime: "2026-06-23 12:00",
    currentEpoch: 1782230400,
    temperature: 82,
    feelsLike: 84,
    rainChance: 0,
    windSpeed: 5,
    maxWind: 7,
    condition: "Sunny",
    forecastHours: [],
    upcomingHours: [],
  },
};

const resultHeading = (page) =>
  page.getByRole("heading", { name: /^(YES|NO)$/ });

test.beforeEach(async ({ page }) => {
  await page.route("**/functions/v1/track-analytics", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accepted: 1 }),
    })
  );

  await page.route("**/functions/v1/get-weather", async (route) => {
    const body = route.request().postDataJSON();

    if (body.action === "search") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          locations: [
            {
              id: 1,
              name: "Chapel Hill",
              region: "North Carolina",
              country: "United States",
              lat: 35.91,
              lon: -79.05,
            },
          ],
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(weatherPayload),
    });
  });
});

test("guest can search and run a jacket check", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Do I need a jacket?" })
  ).toBeVisible();

  await page.getByLabel("Location").fill("Chapel Hill");
  await page.getByRole("option", { name: /Chapel Hill/ }).click();
  await page.getByRole("button", { name: /Check jacket/i }).click();

  await expect(resultHeading(page)).toBeVisible();
});

test("changing location clears the previous result", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Location").fill("Chapel Hill");
  await page.getByRole("option", { name: /Chapel Hill/ }).click();
  await page.getByRole("button", { name: /Check jacket/i }).click();
  await expect(resultHeading(page)).toBeVisible();

  await page.getByLabel("Location").fill("Durham");
  await expect(resultHeading(page)).not.toBeVisible();
});
