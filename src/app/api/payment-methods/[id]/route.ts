import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { parseId, readJson } from "@/lib/http/request";
import { paymentMethodInputSchema } from "@/lib/validation/paymentMethodSchema";
import { deletePaymentMethod, updatePaymentMethod } from "@/services/paymentMethodService";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/payment-methods/:id — changes a payment method's type, name or note. */
export const PUT = withErrorHandling(async (request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  const data = paymentMethodInputSchema.parse(await readJson(request));
  return jsonData(await updatePaymentMethod(id, data));
});

/** DELETE /api/payment-methods/:id — deletes a payment method no subscription uses. */
export const DELETE = withErrorHandling(async (_request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  await deletePaymentMethod(id);
  return new Response(null, { status: 204 });
});
