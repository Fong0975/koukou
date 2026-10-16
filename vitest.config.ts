import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    // Keep test runs from creating log files in the project root.
    env: { LOG_FILE_ENABLED: "false" },
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
