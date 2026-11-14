import type { Prisma } from "@/generated/prisma/client";
import { isCatchAllCategory } from "@/lib/catchAllCategory";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { CategoryData } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { categorySelect } from "./lookupSelects";
import { createInOrder, saveDisplayOrder, type SetSortOrder } from "./lookupTable";
import { rethrowPrismaError } from "./prismaErrors";

const logger = createLogger("categoryService");

const displayOrder: Prisma.CategoryOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { id: "asc" }];

const setSortOrder: SetSortOrder = (tx, id, sortOrder) => tx.category.update({ where: { id }, data: { sortOrder } });

const notFound = "找不到這個類型";
const conflict = (name: string) => `類型「${name}」已存在`;

/**
 * Lists all categories ordered for display.
 *
 * @returns Categories sorted by sortOrder, then id.
 */
export async function listCategories(): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({ select: categorySelect, orderBy: displayOrder });
  logger.debug("Categories listed", { count: categories.length });
  return categories;
}

/**
 * Creates a category at the end of the list, or just before the "其他" catch-all while it is last.
 *
 * @param data - Validated category data.
 * @returns The created category.
 * @throws ConflictError when the name already exists.
 */
export async function createCategory(data: CategoryData): Promise<CategoryDto> {
  try {
    const category = await createInOrder({
      siblings: (tx) =>
        tx.category.findMany({ select: { id: true, name: true, sortOrder: true }, orderBy: displayOrder }),
      staysLast: (row) => isCatchAllCategory(row),
      create: (tx, sortOrder) => tx.category.create({ data: { ...data, sortOrder }, select: categorySelect }),
      setSortOrder,
    });
    logger.info("Category created", { id: category.id, name: category.name });
    return category;
  } catch (error) {
    rethrowPrismaError(error, { conflict: conflict(data.name) });
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
    rethrowPrismaError(error, { notFound, conflict: conflict(data.name) });
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
    rethrowPrismaError(error, { notFound, foreignKey: "仍有扣款項目使用這個類型，無法刪除" });
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
  await saveDisplayOrder(
    ids,
    { listIds: (tx) => tx.category.findMany({ select: { id: true } }), setSortOrder },
    "類型排序與目前的類型不一致，請重新整理後再試",
  );
  logger.info("Categories reordered", { count: ids.length });
  return listCategories();
}
