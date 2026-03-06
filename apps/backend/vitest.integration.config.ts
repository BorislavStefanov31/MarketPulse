import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    globalSetup: "src/__tests__/integration/globalSetup.ts",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
