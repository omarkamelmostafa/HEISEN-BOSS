// backend/vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: [
        "utilities/auth/hash-utils.js",
        "utilities/auth/crypto-utils.js",
        "utilities/auth/user-data-utils.js",
        "services/auth/token-service.js",
        "services/auth/cookie-service.js",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["__tests__/unit/**/*.test.js"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["__tests__/integration/**/*.test.js"],
          setupFiles: ["__tests__/integration/setup.js"],
          testTimeout: 30000,
          pool: "forks",
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
    ],
  },
});
