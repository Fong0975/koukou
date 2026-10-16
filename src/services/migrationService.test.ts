// @vitest-environment node
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaCliPath, runMigrations, type ExecFileFn } from "./migrationService";

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
  const tests: { name: string; exec: ExecFileFn; expected?: string; error?: string }[] = [
    {
      name: "returns stdout on success",
      exec: async () => ({ stdout: "All migrations have been successfully applied.", stderr: "" }),
      expected: "All migrations have been successfully applied.",
    },
    {
      name: "rejects when the CLI fails",
      exec: async () => {
        throw new Error("P1001: Can't reach database server");
      },
      error: "P1001",
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

      expect(exec).toHaveBeenCalledWith(process.execPath, [getPrismaCliPath(cwd), "migrate", "deploy"], {
        cwd,
        env: process.env,
      });
    });
  }
});
