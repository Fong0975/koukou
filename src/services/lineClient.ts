import { randomUUID } from "node:crypto";
import { z } from "zod";
import { UpstreamError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { readSecret } from "@/lib/secret";

const logger = createLogger("services/lineClient");

const PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** Error body of the LINE Messaging API. */
const errorBodySchema = z.object({ message: z.string() });

/** The channel token and recipient a push needs. */
interface LineCredentials {
  token: string;
  userId: string;
}

/**
 * Reads the LINE credentials from `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_USER_ID` (or their `_FILE`
 * Docker secrets). Read on every push so rotated secrets apply without a restart.
 *
 * @returns The credentials, or null when either is missing.
 */
function readCredentials(): LineCredentials | null {
  const token = readSecret("LINE_CHANNEL_ACCESS_TOKEN");
  const userId = readSecret("LINE_USER_ID");
  return token && userId ? { token, userId } : null;
}

/**
 * Reads the reason LINE gives for a rejected request.
 *
 * @param response - The error response.
 * @returns LINE's message, or an empty string when the body has none.
 */
async function errorReason(response: Response): Promise<string> {
  try {
    const parsed = errorBodySchema.safeParse(await response.json());
    return parsed.success ? parsed.data.message : "";
  } catch {
    return "";
  }
}

/**
 * Pushes a text message to the configured LINE user. The token is only ever placed in the
 * Authorization header and never logged.
 *
 * @param text - The message, at most 5000 characters.
 * @throws UpstreamError when LINE is not configured, cannot be reached or rejects the message.
 */
export async function pushText(text: string): Promise<void> {
  const credentials = readCredentials();
  if (!credentials) {
    throw new UpstreamError("尚未設定 LINE：請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_USER_ID");
  }

  let response: Response;
  try {
    response = await fetch(PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        "Content-Type": "application/json",
        // Lets LINE drop a duplicate if this exact request is ever retried.
        "X-Line-Retry-Key": randomUUID(),
      },
      body: JSON.stringify({ to: credentials.userId, messages: [{ type: "text", text }] }),
      cache: "no-store",
    });
  } catch (error) {
    logger.warn("LINE push request failed", {}, error);
    throw new UpstreamError("無法連線到 LINE，請稍後再試");
  }

  if (!response.ok) {
    const reason = await errorReason(response);
    logger.warn("LINE rejected the push", { status: response.status, reason });
    throw new UpstreamError(`LINE 拒絕傳送訊息（HTTP ${response.status}${reason ? `：${reason}` : ""}）`);
  }
  logger.info("LINE message pushed", { length: text.length });
}
