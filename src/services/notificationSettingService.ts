import { DEFAULT_SEND_TIME } from "@/lib/constants/reminders";
import { localDateKey } from "@/lib/date/dateKey";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { isSendTimeReached } from "@/lib/notification/sendTime";
import type { NotificationSettingData } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto, NotificationSettingValuesDto } from "@/types/dto";
import { isLineConfigured } from "./lineClient";
import { skipDayIfUntried } from "./notificationDispatchStore";

const logger = createLogger("notificationSettingService");

/** Id of the single settings row. */
const SETTING_ID = 1;

/** Settings in effect before they are first saved. */
const DEFAULT_NOTIFICATION_SETTING: NotificationSettingValuesDto = {
  enabled: false,
  monthlySummaryEnabled: true,
  sendTime: DEFAULT_SEND_TIME,
};

const settingSelect = { enabled: true, monthlySummaryEnabled: true, sendTime: true } as const;

/**
 * Adds what the client shows next to the stored settings: the server's time zone, which `sendTime`
 * is read in, and whether LINE is configured.
 *
 * @param values - The stored settings.
 */
const toSettingDto = (values: NotificationSettingValuesDto): NotificationSettingDto => ({
  ...values,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  lineConfigured: isLineConfigured(),
});

/**
 * Builds the Prisma `upsert` arguments that store the settings in their single row.
 *
 * @param values - The settings to store.
 */
export function notificationSettingUpsert(values: NotificationSettingValuesDto) {
  return {
    where: { id: SETTING_ID },
    create: { id: SETTING_ID, ...values },
    update: values,
    select: settingSelect,
  };
}

/**
 * Reads the stored settings.
 *
 * @returns The settings, or {@link DEFAULT_NOTIFICATION_SETTING} when never saved.
 */
export async function readNotificationSetting(): Promise<NotificationSettingValuesDto> {
  const setting = await prisma.notificationSetting.findUnique({ where: { id: SETTING_ID }, select: settingSelect });
  return setting ?? DEFAULT_NOTIFICATION_SETTING;
}

/**
 * Reads the settings together with what the client shows next to them.
 *
 * @returns The settings as shown to the client.
 */
export async function getNotificationSetting(): Promise<NotificationSettingDto> {
  return toSettingDto(await readNotificationSetting());
}

/**
 * Saves the settings. Switching notifications on after today's send time has passed starts them
 * tomorrow: today is marked as having nothing to send, so the scheduler does not send at once.
 *
 * @param data - Validated settings.
 * @param now - The current time; dates and the send time are read in the server's time zone.
 * @returns The saved settings as shown to the client.
 */
export async function updateNotificationSetting(
  data: NotificationSettingData,
  now: Date = new Date(),
): Promise<NotificationSettingDto> {
  const previous = await readNotificationSetting();
  const setting = await prisma.notificationSetting.upsert(notificationSettingUpsert(data));
  logger.info("Notification settings updated", { ...setting });

  if (!previous.enabled && setting.enabled && isSendTimeReached(now, setting.sendTime)) {
    const today = localDateKey(now);
    await skipDayIfUntried(today);
    logger.info("Notifications switched on after today's send time; first message tomorrow", { date: today });
  }
  return toSettingDto(setting);
}
