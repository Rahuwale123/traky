import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    // Integration tests share one Postgres/Redis instance and truncate
    // between tests — running files in parallel would race on that shared
    // state, so force everything onto a single worker.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
