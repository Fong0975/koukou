/**
 * Describes where a connection string points without exposing the credentials.
 *
 * @param url - Database connection string.
 * @returns Host (with port) and database name; both undefined when the URL cannot be parsed.
 */
export function describeDatabaseUrl(url: string): { host?: string; database?: string } {
  try {
    const { host, pathname } = new URL(url);
    return { host: host || undefined, database: decodeURIComponent(pathname.replace(/^\//, "")) || undefined };
  } catch {
    return {};
  }
}
