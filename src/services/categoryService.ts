import { prisma } from "@/lib/db";
import type { CategoryData } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { rethrowPrismaError } from "./prismaErrors";

const categorySelect = { id: true, name: true, icon: true, sortOrder: true } as const;

/**
 * Lists all categories ordered for display.
 *
 * @returns Categories sorted by sortOrder, then id.
 */
export async function listCategories(): Promise<CategoryDto[]> {
  return prisma.category.findMany({
    select: categorySelect,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
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
    return await prisma.category.create({
      data: { ...data, sortOrder: 500 },
      select: categorySelect,
    });
  } catch (error) {
    rethrowPrismaError(error, { conflict: `類型「${data.name}」已存在` });
  }
}
