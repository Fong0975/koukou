import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { parseId, readJson } from "@/lib/http/request";
import { categoryInputSchema } from "@/lib/validation/categorySchema";
import { deleteCategory, updateCategory } from "@/services/categoryService";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/categories/:id — renames a category or changes its icon. */
export const PUT = withErrorHandling(async (request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  const data = categoryInputSchema.parse(await readJson(request));
  return jsonData(await updateCategory(id, data));
});

/** DELETE /api/categories/:id — deletes a category no subscription uses. */
export const DELETE = withErrorHandling(async (_request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  await deleteCategory(id);
  return new Response(null, { status: 204 });
});
