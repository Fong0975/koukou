import { jsonData, noContent, withErrorHandling } from "@/lib/http/apiResponse";
import { type IdRouteContext, readJson, routeId } from "@/lib/http/request";
import { categoryInputSchema } from "@/lib/validation/categorySchema";
import { deleteCategory, updateCategory } from "@/services/categoryService";

/** PUT /api/categories/:id — renames a category or changes its icon. */
export const PUT = withErrorHandling(async (request, context: IdRouteContext) => {
  const id = await routeId(context);
  const data = categoryInputSchema.parse(await readJson(request));
  return jsonData(await updateCategory(id, data));
});

/** DELETE /api/categories/:id — deletes a category no subscription uses. */
export const DELETE = withErrorHandling(async (_request, context: IdRouteContext) => {
  const id = await routeId(context);
  await deleteCategory(id);
  return noContent();
});
