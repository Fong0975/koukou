import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// eslint-config-next 15 still ships legacy (eslintrc) presets, so they are loaded through FlatCompat.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const DB_ACCESS_MESSAGE = "Database access belongs in src/services/. UI and API layers must call a service instead.";
const LOGGER_MESSAGE = "The logger writes files with node:fs and runs only on the server. Do not use it in UI code.";

const DB_RESTRICTED_PATHS = [{ name: "@/lib/db", message: DB_ACCESS_MESSAGE }];
const DB_RESTRICTED_PATTERNS = [
  {
    group: ["@/generated/prisma/client", "@/generated/prisma/internal/*", "@/generated/prisma/models/*"],
    message: `${DB_ACCESS_MESSAGE} Import enums from "@/generated/prisma/enums" if you only need enum values.`,
  },
];

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "src/generated/**",
      "prisma/migrations/**",
      "next-env.d.ts",
    ],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["debug", "info", "warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },

  // Enforce the layered architecture: only the service layer may touch Prisma.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/**", "src/lib/db.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: DB_RESTRICTED_PATHS, patterns: DB_RESTRICTED_PATTERNS }],
    },
  },

  // Keep the server-only logger out of UI code. The DB restrictions are repeated because a later
  // block replaces the rule's options instead of merging them.
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...DB_RESTRICTED_PATHS, { name: "@/lib/logger", message: LOGGER_MESSAGE }],
          patterns: [...DB_RESTRICTED_PATTERNS, { group: ["@/lib/logger/*"], message: LOGGER_MESSAGE }],
        },
      ],
    },
  },

  // Must stay last: turns off stylistic rules that would fight with Prettier.
  eslintConfigPrettier,
];

export default eslintConfig;
