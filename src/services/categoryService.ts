import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { CategoryData } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { rethrowPrismaError } from "./prismaErrors";
import { assertSameIds, sortOrderAt } from "./reorderIds";

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

/**
 * Renames a category or changes its icon.
 *
 * @param id - Category id.
 * @param data - Validated category data.
 * @returns The updated category.
 * @throws NotFoundError when the category does not exist; ConflictError when the name is taken.
 */
export async function updateCategory(id: number, data: CategoryData): Promise<CategoryDto> {
  try {
    const category = await prisma.category.update({ where: { id }, data, select: categorySelect });
    logger.info("Category updated", { id, name: category.name });
    return category;
  } catch (error) {
    rethrowPrismaError(error, { notFound: "找不到這個類型", conflict: `類型「${data.name}」已存在` });
  }
}

/**
 * Deletes a category that no subscription uses.
 *
 * @param id - Category id.
 * @throws NotFoundError when the category does not exist; ValidationError when a subscription still uses it.
 */
export async function deleteCategory(id: number): Promise<void> {
  try {
    await prisma.category.delete({ where: { id } });
    logger.info("Category deleted", { id });
  } catch (error) {
    rethrowPrismaError(error, { notFound: "找不到這個類型", foreignKey: "仍有扣款項目使用這個類型，無法刪除" });
  }
}

/**
 * Saves a new display order by renumbering every category's sortOrder in steps of 10.
 *
 * @param ids - Every existing category id, in the desired order.
 * @returns The categories in their new order.
 * @throws ValidationError when ids is not exactly the set of existing category ids.
 */
export async function reorderCategories(ids: number[]): Promise<CategoryDto[]> {
  const existing = await prisma.category.findMany({ select: { id: true } });
  assertSameIds(
    ids,
    existing.map((category) => category.id),
    "類型排序與目前的類型不一致，請重新整理後再試",
  );

  await prisma.$transaction(
    ids.map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: sortOrderAt(index) } })),
  );
  logger.info("Categories reordered", { count: ids.length });
  return listCategories();
}
