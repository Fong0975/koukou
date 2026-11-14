import { jsonData, noContent, withErrorHandling } from "@/lib/http/apiResponse";
import { type IdRouteContext, readJson, routeId } from "@/lib/http/request";
import { paymentMethodInputSchema } from "@/lib/validation/paymentMethodSchema";
import { deletePaymentMethod, updatePaymentMethod } from "@/services/paymentMethodService";

/** PUT /api/payment-methods/:id — changes a payment method's type, name or note. */
export const PUT = withErrorHandling(async (request, context: IdRouteContext) => {
  const id = await routeId(context);
  const data = paymentMethodInputSchema.parse(await readJson(request));
  return jsonData(await updatePaymentMethod(id, data));
});

/** DELETE /api/payment-methods/:id — deletes a payment method no subscription uses. */
export const DELETE = withErrorHandling(async (_request, context: IdRouteContext) => {
  const id = await routeId(context);
  await deletePaymentMethod(id);
  return noContent();
});
