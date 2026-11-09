import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { paymentMethodOrderSchema } from "@/lib/validation/paymentMethodSchema";
import { reorderPaymentMethods } from "@/services/paymentMethodService";

/** PUT /api/payment-methods/order — saves the display order of all payment methods. */
export const PUT = withErrorHandling(async (request) => {
  const { ids } = paymentMethodOrderSchema.parse(await readJson(request));
  return jsonData(await reorderPaymentMethods(ids));
});
