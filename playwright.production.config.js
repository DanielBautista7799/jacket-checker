import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const rawBaseUrl = String(process.env.PRODUCTION_BASE_URL || "").trim();
if (!rawBaseUrl) {
  throw new Error("Set PRODUCTION_BASE_URL to the deployed HTTPS site before running production smoke tests.");
}

const parsedBaseUrl = new URL(rawBaseUrl);
if (parsedBaseUrl.protocol !== "https:") {
  throw new Error("PRODUCTION_BASE_URL must use HTTPS.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "production-smoke.spec.js",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-production", open: "never" }]],
  use: {
    baseURL: parsedBaseUrl.origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "production-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "production-mobile", use: { ...devices["Pixel 5"] } },
  ],
});
