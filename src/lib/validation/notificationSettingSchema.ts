import { z } from "zod";

/** "HH:mm" on a 24-hour clock, e.g. "09:00". */
const SEND_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Payload for saving the LINE notification settings. */
export const notificationSettingInputSchema = z.object(
  {
    enabled: z.boolean({ error: "通知開關格式錯誤" }),
    monthlySummaryEnabled: z.boolean({ error: "每月摘要開關格式錯誤" }),
    sendTime: z
      .string({ error: "請輸入傳送時間" })
      .trim()
      .regex(SEND_TIME_PATTERN, "傳送時間需為 HH:mm 格式，例如 09:00"),
  },
  { error: "通知設定格式錯誤" },
);

export type NotificationSettingInput = z.input<typeof notificationSettingInputSchema>;
export type NotificationSettingData = z.output<typeof notificationSettingInputSchema>;
