import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { createLogger } from "@/lib/logger";

/** Minimal execFile signature, injectable for testing. */
export type ExecFileFn = (
  file: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<{ stdout: string; stderr: string }>;

const logger = createLogger("migrationService");

const execFileAsync = promisify(execFile);

const defaultExec: ExecFileFn = (file, args, options) => execFileAsync(file, args, { ...options, encoding: "utf8" });

/**
 * Resolves the Prisma CLI entry script. It is invoked through the current Node binary
 * instead of `npx` so it works on Windows without spawning a shell.
 *
 * @param cwd - Project root directory.
 * @returns Absolute path of the Prisma CLI script.
 */
export function getPrismaCliPath(cwd: string = process.cwd()): string {
  return path.join(cwd, "node_modules", "prisma", "build", "index.js");
}

/**
 * Applies all pending migrations (`prisma migrate deploy`), creating tables on an empty
 * database and adding new tables/columns introduced by later migrations.
 *
 * @param exec - Process runner; defaults to child_process.execFile.
 * @param cwd - Project root directory.
 * @returns The CLI's stdout.
 * @throws Error when the CLI exits with a non-zero code.
 */
export async function runMigrations(exec: ExecFileFn = defaultExec, cwd: string = process.cwd()): Promise<string> {
  const { stdout, stderr } = await exec(process.execPath, [getPrismaCliPath(cwd), "migrate", "deploy"], {
    cwd,
    env: process.env,
  });
  logger.debug("prisma migrate deploy finished", { stdout: stdout.trim() });
  if (stderr.trim()) logger.warn("prisma migrate deploy wrote to stderr", { stderr: stderr.trim() });
  return stdout;
}
