import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORIES, type DefaultCategory } from "@/lib/constants/defaultCategories";

/**
 * Inserts default categories that do not exist yet. Existing rows are left untouched
 * so user edits survive restarts, which makes this safe to run on every start-up.
 *
 * @param categories - Categories to ensure; defaults to {@link DEFAULT_CATEGORIES}.
 * @returns The number of categories processed.
 */
export async function seedDefaults(categories: readonly DefaultCategory[] = DEFAULT_CATEGORIES): Promise<number> {
  await prisma.$transaction(
    categories.map((category) =>
      prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      }),
    ),
  );
  return categories.length;
}
