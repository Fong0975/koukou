import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { sendTestMessage } from "@/services/reminderService";

/** POST /api/notification-settings/test — sends a LINE test message. */
export const POST = withErrorHandling(async () => {
  await sendTestMessage();
  return jsonData({ sent: true });
});
