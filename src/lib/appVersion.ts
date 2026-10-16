/**
 * Formats the app version for display.
 *
 * @param version - Semantic version from package.json, or undefined when not injected (e.g. in tests).
 * @returns A label such as "v0.1.3", or "dev" when the version is unknown.
 */
export function formatAppVersion(version: string | undefined): string {
  const trimmed = version?.trim();
  return trimmed ? `v${trimmed.replace(/^v/, "")}` : "dev";
}

/** Display label of the running build, injected from package.json by next.config.ts. */
export const APP_VERSION_LABEL = formatAppVersion(process.env.NEXT_PUBLIC_APP_VERSION);
