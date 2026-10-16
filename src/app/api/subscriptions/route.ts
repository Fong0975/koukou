import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { subscriptionInputSchema } from "@/lib/validation/subscriptionSchema";
import { createSubscription, listSubscriptions } from "@/services/subscriptionService";

/** GET /api/subscriptions — lists all subscriptions. */
export const GET = withErrorHandling(async () => jsonData(await listSubscriptions()));

/** POST /api/subscriptions — creates a subscription. */
export const POST = withErrorHandling(async (request) => {
  const data = subscriptionInputSchema.parse(await readJson(request));
  return jsonData(await createSubscription(data), 201);
});
