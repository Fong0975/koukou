import { readFileSync } from "node:fs";

/**
 * Reads a secret, preferring the file named by `<key>_FILE` (the Docker secrets convention,
 * e.g. `/run/secrets/database_url`) over the plain `<key>` variable, so a secret mounted into
 * a container never has to appear in its environment.
 *
 * Trailing CR/LF is trimmed because secret files are commonly written with a terminating
 * newline; other whitespace is kept since it may be part of the secret itself.
 *
 * @param key - Name of the plain environment variable, e.g. `DATABASE_URL`.
 * @param env - Environment to read from; defaults to `process.env`.
 * @returns The secret, or undefined when it is not configured (or the file is empty).
 * @throws Error when `<key>_FILE` is set but the file cannot be read.
 */
export function readSecret(key: string, env: Record<string, string | undefined> = process.env): string | undefined {
  const fileKey = `${key}_FILE`;
  const path = env[fileKey];
  if (!path) return env[key] || undefined;

  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`Failed to read ${fileKey} (${path}): ${error instanceof Error ? error.message : String(error)}`);
  }
  return content.replace(/[\r\n]+$/, "") || undefined;
}
