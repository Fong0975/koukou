import { jsonData, noContent, withErrorHandling } from "@/lib/http/apiResponse";
import { type IdRouteContext, readJson, routeId } from "@/lib/http/request";
import { subscriptionInputSchema } from "@/lib/validation/subscriptionSchema";
import { deleteSubscription, getSubscription, updateSubscription } from "@/services/subscriptionService";

/** GET /api/subscriptions/:id — fetches one subscription. */
export const GET = withErrorHandling(async (_request, context: IdRouteContext) => {
  const id = await routeId(context);
  return jsonData(await getSubscription(id));
});

/** PUT /api/subscriptions/:id — replaces a subscription and its schedules. */
export const PUT = withErrorHandling(async (request, context: IdRouteContext) => {
  const id = await routeId(context);
  const data = subscriptionInputSchema.parse(await readJson(request));
  return jsonData(await updateSubscription(id, data));
});

/** DELETE /api/subscriptions/:id — deletes a subscription. */
export const DELETE = withErrorHandling(async (_request, context: IdRouteContext) => {
  const id = await routeId(context);
  await deleteSubscription(id);
  return noContent();
});
