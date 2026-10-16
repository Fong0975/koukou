import "dotenv/config";
import { prisma } from "@/lib/db";
import { seedDefaults } from "@/services/seedService";

/**
 * CLI entry for `prisma db seed` / `npm run db:seed`.
 */
async function main(): Promise<void> {
  const count = await seedDefaults();
  console.info(`[koukou] Seeded ${count} default categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
