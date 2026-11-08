import { DEFAULT_SEND_TIME } from "@/lib/constants/reminders";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { NotificationSettingData } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto, NotificationSettingValuesDto } from "@/types/dto";

const logger = createLogger("notificationSettingService");

/** Id of the single settings row. */
const SETTING_ID = 1;

/** Settings in effect before they are first saved. */
export const DEFAULT_NOTIFICATION_SETTING: NotificationSettingValuesDto = {
  enabled: false,
  monthlySummaryEnabled: true,
  sendTime: DEFAULT_SEND_TIME,
};

const settingSelect = { enabled: true, monthlySummaryEnabled: true, sendTime: true } as const;

/** IANA name of the time zone the server runs in, which `sendTime` is read in. */
const serverTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

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
 * Reads the settings together with the time zone their send time is read in.
 *
 * @returns The settings as shown to the client.
 */
export async function getNotificationSetting(): Promise<NotificationSettingDto> {
  return { ...(await readNotificationSetting()), timeZone: serverTimeZone() };
}

/**
 * Saves the settings.
 *
 * @param data - Validated settings.
 * @returns The saved settings as shown to the client.
 */
export async function updateNotificationSetting(data: NotificationSettingData): Promise<NotificationSettingDto> {
  const setting = await prisma.notificationSetting.upsert(notificationSettingUpsert(data));
  logger.info("Notification settings updated", { ...setting });
  return { ...setting, timeZone: serverTimeZone() };
}
