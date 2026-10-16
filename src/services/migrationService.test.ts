// @vitest-environment node
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loggerMock } from "@/test/logger";
import { getPrismaCliPath, runMigrations, type ExecFileFn } from "./migrationService";

vi.mock("@/lib/logger", () => import("@/test/logger"));

afterEach(() => {
  vi.clearAllMocks();
});

describe("getPrismaCliPath", () => {
  const tests = [
    {
      name: "joins cwd with the prisma CLI entry",
      cwd: "/app",
      expected: path.join("/app", "node_modules", "prisma", "build", "index.js"),
    },
    {
      name: "handles nested project roots",
      cwd: "/a/b/c",
      expected: path.join("/a/b/c", "node_modules", "prisma", "build", "index.js"),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(getPrismaCliPath(tt.cwd)).toBe(tt.expected);
    });
  }
});

describe("runMigrations", () => {
  const cwd = "/project";
  const tests: {
    name: string;
    exec: ExecFileFn;
    expected?: string;
    error?: string;
    expectedDebug: unknown[][];
  }[] = [
    {
      name: "returns stdout on success",
      exec: async () => ({ stdout: "All migrations have been successfully applied.\n", stderr: "" }),
      expected: "All migrations have been successfully applied.\n",
      expectedDebug: [["prisma migrate deploy finished", { stdout: "All migrations have been successfully applied." }]],
    },
    {
      name: "logs routine stderr output at debug",
      exec: async () => ({
        stdout: "No pending migrations.",
        stderr: " Loaded Prisma config from prisma.config.ts.\n",
      }),
      expected: "No pending migrations.",
      expectedDebug: [
        ["prisma migrate deploy finished", { stdout: "No pending migrations." }],
        ["prisma migrate deploy stderr", { stderr: "Loaded Prisma config from prisma.config.ts." }],
      ],
    },
    {
      name: "rejects when the CLI fails",
      exec: async () => {
        throw new Error("P1001: Can't reach database server");
      },
      error: "P1001",
      expectedDebug: [],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const exec = vi.fn(tt.exec);

      if (tt.error) {
        await expect(runMigrations(exec, cwd)).rejects.toThrow(tt.error);
      } else {
        await expect(runMigrations(exec, cwd)).resolves.toBe(tt.expected);
      }

      expect(loggerMock.debug.mock.calls).toEqual(tt.expectedDebug);
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(exec).toHaveBeenCalledWith(process.execPath, [getPrismaCliPath(cwd), "migrate", "deploy"], {
        cwd,
        env: process.env,
      });
    });
  }
});
