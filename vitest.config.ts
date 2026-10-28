import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve .js extensions to their .ts source files (ESM + Vitest native)
  resolve: {
    conditions: ["node"],
  },
  test: {
    // Use the Node environment for server-side tests
    environment: "node",
    // Global setup — sets environment variables before any import runs
    setupFiles: ["./tests/setup.ts"],
    // Timeout for integration tests that hit a real database
    testTimeout: 30_000,
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/types/**"],
    },
  },
});
