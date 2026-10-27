import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/system/**/*.test.ts"],
    testTimeout: 90000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
