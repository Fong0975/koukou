# CLAUDE.md

KouKou is a Next.js (App Router) + TypeScript app for tracking recurring payments, backed by MySQL through Prisma. See `README.md` for setup and scripts.

## Working rules

- Unless the user explicitly asks, do not run any build, compile, format, lint, type-check or test command after changing code or files, and do not change git state (no staging, committing, stashing, branching, resetting, pushing or pulling).

## Architecture

Keep the layers separated; ESLint enforces the database rule.

- **UI** (`src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/`, `src/hooks/`): rendering and client state only. Talk to the backend through `src/lib/apiClient.ts`; never import `@/lib/db` or the generated Prisma client.
- **API** (`src/app/api/`): parse the request, validate with the zod schemas in `src/lib/validation/`, call a service, return JSON via the helpers in `src/lib/http/`. No business logic and no Prisma calls.
- **Services** (`src/services/`): all business logic and every Prisma read/write.
- **Database client**: always import the single instance from `src/lib/db.ts`; never create another `PrismaClient`.
- **Schema changes**: edit `prisma/schema.prisma` and add a migration; migrations are applied automatically on start-up.

## Keep files small and focused

- Whenever you add to or change a file, check whether it now has more than one responsibility or has grown hard to follow. If so, split it (e.g. extract a component, hook, helper module or service) as part of the same change, and split its test file to match.
- Prefer several small, single-purpose modules over one large file. A component that renders, fetches and transforms data should become separate pieces.
- Only restructure files you are already touching; do not refactor unrelated files unprompted.

## Don't repeat yourself

- When you notice repeated or near-identical logic, markup or styles (in the file you are editing or between it and existing code), consider extracting a shared function, hook, component, class or CSS utility instead of writing it again.
- Look for an existing helper before writing a new one, e.g. `src/lib/format.ts`, `src/lib/labels.ts`, `src/lib/http/`, `src/lib/validation/common.ts`, `src/hooks/useAsyncAction.ts`, and the component classes in `src/app/globals.css` (`.glass`, `.btn`, `.field`, …).
- Repeated Tailwind class combinations used in several places should become a component or a class in `globals.css`.
- Shared test helpers belong in `src/test/`.

## Unit tests

- Every code change must be evaluated for test impact: add or update unit tests for new or changed behavior, even when not explicitly asked, covering the full scope of the change.
- If a test is not worth adding (e.g. it would need prohibitively heavy mocking), say why instead of silently skipping it.
- Write tests table-driven: one `describe` per function or component, a `tests` array of cases, and a single loop that runs them. Do not write one standalone `it` per case.

  ```ts
  describe("formatSchedule", () => {
    const tests = [
      { name: "daily", schedule: { cycle: "DAILY", ... }, expected: "每天" },
      { name: "monthly", schedule: { cycle: "MONTHLY", dayOfMonth: 15, ... }, expected: "每月 15 日" },
    ] as const;

    for (const tt of tests) {
      it(tt.name, () => {
        expect(formatSchedule(tt.schedule)).toBe(tt.expected);
      });
    }
  });
  ```

- Tests use Vitest and live next to the code as `*.test.ts(x)`. Server-side tests start with `// @vitest-environment node`; service tests mock `@/lib/db`, and API route tests mock the service module.
