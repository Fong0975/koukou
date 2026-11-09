import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { categoryOrderSchema } from "@/lib/validation/categorySchema";
import { reorderCategories } from "@/services/categoryService";

/** PUT /api/categories/order — saves the display order of all categories. */
export const PUT = withErrorHandling(async (request) => {
  const { ids } = categoryOrderSchema.parse(await readJson(request));
  return jsonData(await reorderCategories(ids));
});
