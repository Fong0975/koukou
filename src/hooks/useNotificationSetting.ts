"use client";

import { useCallback } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { NotificationSettingInput } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto } from "@/types/dto";
import { useApiResource } from "./useApiResource";

const SETTINGS_PATH = "/api/notification-settings";

const fetchSetting = () => apiRequest<NotificationSettingDto | null>(SETTINGS_PATH);

/**
 * Whether LINE reminders actually go out: the main switch is on and LINE is set up on the server.
 *
 * @param setting - The loaded settings, or null while they are loading or failed to load.
 */
export function areRemindersActive(setting: NotificationSettingDto | null): boolean {
  return Boolean(setting?.enabled && setting.lineConfigured);
}

/**
 * Loads the LINE notification settings when mounted, saves them and sends a test message.
 * `save` and `sendTest` throw ApiClientError so callers can show field errors.
 */
export function useNotificationSetting() {
  const {
    data: setting,
    loadError,
    reload,
    setData: setSetting,
  } = useApiResource(fetchSetting, null, "notification settings");

  const save = useCallback(
    async (input: NotificationSettingInput) => {
      const saved = await apiRequest<NotificationSettingDto>(SETTINGS_PATH, { method: "PUT", body: input });
      setSetting(saved);
      return saved;
    },
    [setSetting],
  );

  const sendTest = useCallback(async () => {
    await apiRequest<{ sent: boolean }>(`${SETTINGS_PATH}/test`, { method: "POST" });
  }, []);

  return { setting, loadError, reload, save, sendTest, remindersActive: areRemindersActive(setting) };
}
