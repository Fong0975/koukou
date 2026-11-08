import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    // Create the jsdom environment once per worker instead of once per test file, keeping per-file isolation.
    pool: "vmThreads",
    // Keep test runs from creating log files in the project root, and keep routine records out of the output.
    env: { LOG_FILE_ENABLED: "false", LOG_LEVEL: "ERROR" },
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "prisma/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        // Framework shells with no logic of their own.
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/generated/**",
        "src/types/**",
        "**/*.d.ts",
      ],
      thresholds: { lines: 85 },
    },
  },
});
