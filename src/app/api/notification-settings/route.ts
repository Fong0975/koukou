import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { notificationSettingInputSchema } from "@/lib/validation/notificationSettingSchema";
import { getNotificationSetting, updateNotificationSetting } from "@/services/notificationSettingService";

/** GET /api/notification-settings — reads the LINE notification settings. */
export const GET = withErrorHandling(async () => jsonData(await getNotificationSetting()));

/** PUT /api/notification-settings — saves the LINE notification settings. */
export const PUT = withErrorHandling(async (request) => {
  const data = notificationSettingInputSchema.parse(await readJson(request));
  return jsonData(await updateNotificationSetting(data));
});
