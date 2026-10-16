import { prisma } from "@/lib/db";

/**
 * Verifies the database is reachable with a trivial query.
 *
 * @throws Error when the database cannot be queried.
 */
export async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
