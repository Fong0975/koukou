"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { NotificationSettingInput } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto } from "@/types/dto";

const SETTINGS_PATH = "/api/notification-settings";

type FetchResult = { setting: NotificationSettingDto } | { error: string };

/** Fetches the settings and reports failure as a value so callers can apply it to state. */
async function fetchSetting(): Promise<FetchResult> {
  try {
    return { setting: await apiRequest<NotificationSettingDto>(SETTINGS_PATH) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "讀取失敗" };
  }
}

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
 * `save` and `sendTest` throw ApiClientError so callers can show field errors; `apply` takes settings
 * saved elsewhere, e.g. by the settings dialog's own instance of this hook.
 */
export function useNotificationSetting() {
  const [setting, setSetting] = useState<NotificationSettingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyResult = useCallback((result: FetchResult) => {
    if ("setting" in result) setSetting(result.setting);
    else setLoadError(result.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchSetting().then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  const reload = useCallback(async () => {
    setLoadError(null);
    applyResult(await fetchSetting());
  }, [applyResult]);

  const save = useCallback(async (input: NotificationSettingInput) => {
    const saved = await apiRequest<NotificationSettingDto>(SETTINGS_PATH, { method: "PUT", body: input });
    setSetting(saved);
    return saved;
  }, []);

  const sendTest = useCallback(async () => {
    await apiRequest<{ sent: boolean }>(`${SETTINGS_PATH}/test`, { method: "POST" });
  }, []);

  return {
    setting,
    loadError,
    reload,
    save,
    sendTest,
    apply: setSetting,
    remindersActive: areRemindersActive(setting),
  };
}
