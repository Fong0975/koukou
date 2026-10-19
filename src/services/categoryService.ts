import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { CategoryData } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { rethrowPrismaError } from "./prismaErrors";

const logger = createLogger("categoryService");

/** Columns of a category returned by the API and written to backups. */
export const categorySelect = { id: true, name: true, icon: true, sortOrder: true } as const;

/**
 * Lists all categories ordered for display.
 *
 * @returns Categories sorted by sortOrder, then id.
 */
export async function listCategories(): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    select: categorySelect,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  logger.debug("Categories listed", { count: categories.length });
  return categories;
}

/**
 * Creates a category; new categories are placed before the "其他" catch-all (sortOrder 999).
 *
 * @param data - Validated category data.
 * @returns The created category.
 * @throws ConflictError when the name already exists.
 */
export async function createCategory(data: CategoryData): Promise<CategoryDto> {
  try {
    const category = await prisma.category.create({
      data: { ...data, sortOrder: 500 },
      select: categorySelect,
    });
    logger.info("Category created", { id: category.id, name: category.name });
    return category;
  } catch (error) {
    rethrowPrismaError(error, { conflict: `類型「${data.name}」已存在` });
  }
}
