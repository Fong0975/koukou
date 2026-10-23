import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { describeDatabaseUrl } from "@/lib/databaseUrl";
import { createLogger } from "@/lib/logger";
import { readSecret } from "@/lib/secret";

const logger = createLogger("db");

/**
 * Creates a Prisma client backed by the MariaDB/MySQL driver adapter.
 *
 * @returns A new PrismaClient instance.
 * @throws Error when DATABASE_URL is not configured.
 */
function createPrismaClient(): PrismaClient {
  const url = readSecret("DATABASE_URL");
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set (or DATABASE_URL_FILE is empty). Copy .env.example to .env and fill it in.",
    );
  }
  const client = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  logger.debug("Prisma client created", describeDatabaseUrl(url));
  return client;
}

// Reuse a single client across hot reloads in development to avoid exhausting DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** The only Prisma client instance of the application. */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
