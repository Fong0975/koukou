import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { categoryInputSchema } from "@/lib/validation/categorySchema";
import { createCategory, listCategories } from "@/services/categoryService";

/** GET /api/categories — lists all categories. */
export const GET = withErrorHandling(async () => jsonData(await listCategories()));

/** POST /api/categories — creates a category. */
export const POST = withErrorHandling(async (request) => {
  const data = categoryInputSchema.parse(await readJson(request));
  return jsonData(await createCategory(data), 201);
});
