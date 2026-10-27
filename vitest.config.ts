import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "apps/**/*.test.ts",
      "packages/**/*.test.ts",
      "tests/unit/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    testTimeout: 15000,
  },
});
