import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    css: false,
    include: [
      "tests/unit/**/*.{test,spec}.{js,jsx}",
      "tests/components/**/*.{test,spec}.{js,jsx}",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      reporter: ["text", "json-summary"],
      include: ["src/utils/**/*.{js,jsx}", "src/components/**/*.{js,jsx}"],
    },
  },
});
