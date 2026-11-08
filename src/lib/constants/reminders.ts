/** Most days ahead a charge reminder may be sent. */
export const MAX_CHARGE_REMINDER_DAYS_BEFORE = 30;

/** Most charge reminders per subscription besides the one on the charge day itself. */
export const MAX_CUSTOM_CHARGE_REMINDERS = 5;

/** Days ahead of a contract end date that an expiry reminder can be sent, largest first. */
export const EXPIRY_REMINDER_DAYS = [7, 1, 0] as const;

/** Default send time of the daily LINE message, "HH:mm" in the server's time zone. */
export const DEFAULT_SEND_TIME = "09:00";
