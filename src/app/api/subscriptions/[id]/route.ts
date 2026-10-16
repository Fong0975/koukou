import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { parseId, readJson } from "@/lib/http/request";
import { subscriptionInputSchema } from "@/lib/validation/subscriptionSchema";
import { deleteSubscription, getSubscription, updateSubscription } from "@/services/subscriptionService";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/subscriptions/:id — fetches one subscription. */
export const GET = withErrorHandling(async (_request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  return jsonData(await getSubscription(id));
});

/** PUT /api/subscriptions/:id — replaces a subscription and its schedules. */
export const PUT = withErrorHandling(async (request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  const data = subscriptionInputSchema.parse(await readJson(request));
  return jsonData(await updateSubscription(id, data));
});

/** DELETE /api/subscriptions/:id — deletes a subscription. */
export const DELETE = withErrorHandling(async (_request, { params }: RouteContext) => {
  const id = parseId((await params).id);
  await deleteSubscription(id);
  return new Response(null, { status: 204 });
});
