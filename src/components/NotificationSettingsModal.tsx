"use client";

import { useNotificationSetting } from "@/hooks/useNotificationSetting";
import type { NotificationSettingInput } from "@/lib/validation/notificationSettingSchema";
import type { NotificationSettingDto } from "@/types/dto";
import { GuardedModal } from "./GuardedModal";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

interface NotificationSettingsModalProps {
  onClose: () => void;
  /** Called with the settings once they are saved, so the rest of the page can follow them. */
  onSaved: (setting: NotificationSettingDto) => void;
}

/**
 * Dialog for the LINE notification settings. Loads them when opened and shows the form once
 * they arrive, or the reason they could not be read with a retry button.
 *
 * @param props.onClose - Closes the dialog.
 * @param props.onSaved - Receives the saved settings.
 */
export function NotificationSettingsModal({ onClose, onSaved }: NotificationSettingsModalProps) {
  const { setting, loadError, reload, save, sendTest } = useNotificationSetting();

  const saveAndReport = async (input: NotificationSettingInput) => {
    const saved = await save(input);
    onSaved(saved);
    return saved;
  };

  return (
    <GuardedModal title="通知設定" onClose={onClose} titleClassName="font-semibold">
      {setting ? (
        <NotificationSettingsForm setting={setting} onSave={saveAndReport} onSendTest={sendTest} onClose={onClose} />
      ) : loadError ? (
        <div role="alert" className="text-center">
          <p className="text-ink-soft">{loadError}</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={() => void reload()}>
            重新讀取
          </button>
        </div>
      ) : (
        <p className="text-center text-ink-soft">讀取中…</p>
      )}
    </GuardedModal>
  );
}
