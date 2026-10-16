import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// eslint-config-next 15 still ships legacy (eslintrc) presets, so they are loaded through FlatCompat.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const DB_ACCESS_MESSAGE = "Database access belongs in src/services/. UI and API layers must call a service instead.";

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
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
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
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "@/lib/db", message: DB_ACCESS_MESSAGE }],
          patterns: [
            {
              group: ["@/generated/prisma/client", "@/generated/prisma/internal/*", "@/generated/prisma/models/*"],
              message: `${DB_ACCESS_MESSAGE} Import enums from "@/generated/prisma/enums" if you only need enum values.`,
            },
          ],
        },
      ],
    },
  },

  // Must stay last: turns off stylistic rules that would fight with Prettier.
  eslintConfigPrettier,
];

export default eslintConfig;
