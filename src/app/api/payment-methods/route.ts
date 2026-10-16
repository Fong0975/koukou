import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { paymentMethodInputSchema } from "@/lib/validation/paymentMethodSchema";
import { createPaymentMethod, listPaymentMethods } from "@/services/paymentMethodService";

/** GET /api/payment-methods — lists all payment methods. */
export const GET = withErrorHandling(async () => jsonData(await listPaymentMethods()));

/** POST /api/payment-methods — creates a payment method. */
export const POST = withErrorHandling(async (request) => {
  const data = paymentMethodInputSchema.parse(await readJson(request));
  return jsonData(await createPaymentMethod(data), 201);
});
